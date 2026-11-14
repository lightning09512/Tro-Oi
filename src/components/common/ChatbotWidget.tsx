
import { useState, type FormEvent } from "react";

type ChatMessage = {
  role: "user" | "model";
  text: string;
};

type Room = {
  id: string;
  title: string;
  location?: string;
  price_vnd?: number;
  aiScore?: number;
};

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(e: FormEvent) {
    e.preventDefault();

    const message = input.trim();
    if (!message || loading) return;

    const previous = messages;

    setMessages(old => [
      ...old,
      { role: "user", text: message }
    ]);
    setInput("");
    setRooms([]);
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          history: previous.slice(-20)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
            data.error || "Chatbot không phản hồi"
        );
      }

      setMessages(old => [
        ...old,
        { role: "model", text: data.reply }
      ]);

      setRooms(data.rooms || []);
    } catch (err) {
      setError(
          err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="fixed bottom-6 right-6 z-50">
        {!open && (
            <button
                onClick={() => setOpen(true)}
                className="rounded-full bg-blue-600 px-5 py-4 text-white shadow-lg"
            >
              💬 Tư vấn AI
            </button>
        )}

        {open && (
            <section className="flex h-[560px] max-h-[85vh] w-[360px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
              <header className="flex items-center justify-between bg-blue-600 p-4 text-white">
                <div>
                  <h3 className="font-bold">Trợ lý AI Trọ Ơi</h3>
                  <p className="text-xs">Tư vấn và tìm phòng trọ</p>
                </div>

                <button
                    onClick={() => setOpen(false)}
                    aria-label="Đóng chatbot"
                >
                  ✕
                </button>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Xin chào! Bạn muốn tìm phòng ở khu vực nào?
                    </p>
                )}

                {messages.map((item, index) => (
                    <div
                        key={index}
                        className={
                          item.role === "user"
                              ? "ml-8 rounded-xl bg-blue-100 p-3"
                              : "mr-8 rounded-xl bg-gray-100 p-3"
                        }
                    >
                      <p className="whitespace-pre-wrap text-sm text-gray-800">
                        {item.text}
                      </p>
                    </div>
                ))}

                {rooms.map(room => (
                    <button
                        type="button"
                        key={room.id}
                        onClick={() => { window.location.href = `/phong/${encodeURIComponent(room.id)}` }}
                        className="block w-full rounded-xl border bg-white p-3 text-left transition hover:border-blue-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        aria-label={`Xem chi tiết phòng ${room.title}`}
                    >
                      <h4 className="font-semibold">
                        {room.title}
                      </h4>

                      <p className="text-sm text-gray-600">
                        {room.location}
                      </p>

                      {room.price_vnd != null && (
                          <p className="font-medium text-blue-700">
                            {Number(room.price_vnd).toLocaleString("vi-VN")}đ/tháng
                          </p>
                      )}

                      <p className="text-xs text-gray-500">
                        Mã phòng: {room.id}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-blue-600">
                        Xem chi tiết phòng →
                      </p>
                    </button>
                ))}

                {loading && (
                    <p className="text-sm text-gray-500">
                      AI đang xử lý...
                    </p>
                )}

                {error && (
                    <p role="alert" className="text-sm text-red-600">
                      {error}
                    </p>
                )}
              </div>

              <form
                  onSubmit={sendMessage}
                  className="flex gap-2 border-t p-3"
              >
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Nhập nhu cầu tìm phòng..."
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                    maxLength={2000}
                />

                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  Gửi
                </button>
              </form>
            </section>
        )}
      </div>
  );
}