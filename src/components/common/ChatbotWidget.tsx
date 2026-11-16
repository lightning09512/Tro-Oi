import { useState, useRef, useEffect, type FormEvent } from "react";

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

const QUICK_PROMPTS = [
  "Phòng trọ dưới 3 triệu ở Thủ Đức",
  "Phòng có máy lạnh gần ĐH SPKT",
  "Cần tìm bạn ở ghép Quận 10",
  "Căn hộ mini đầy đủ nội thất Bình Thạnh",
];

const MASCOT_IMG = "/images/avatars/tro-oi-ai-assistant.jpg";

function FormattedMessage({
  content,
  isUser = false,
}: {
  content: string;
  isUser?: boolean;
}) {
  const lines = content.split("\n");

  const formatInline = (text: string) => {
    // Regex splits by **bold** or `code`
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={pIdx}
            className={
              isUser
                ? "font-bold text-white"
                : "font-bold text-gray-900"
            }
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={pIdx}
            className={`rounded px-1 py-0.5 font-mono text-[11px] ${
              isUser
                ? "bg-white/20 text-white"
                : "bg-emerald-50 text-[#0F5132] font-semibold"
            }`}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Check if line is a bullet item (- or * or •)
        if (/^[-*•]\s+/.test(trimmed)) {
          const bulletText = trimmed.replace(/^[-*•]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span
                className={`mt-1.5 size-1.5 flex-shrink-0 rounded-full ${
                  isUser ? "bg-white" : "bg-[#059669]"
                }`}
              />
              <div className="flex-1">{formatInline(bulletText)}</div>
            </div>
          );
        }

        // Check if line is a numbered item (e.g. 1. 2.)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span
                className={`flex-shrink-0 font-bold ${
                  isUser ? "text-white" : "text-[#0F5132]"
                }`}
              >
                {numMatch[1]}.
              </span>
              <div className="flex-1 font-normal">{formatInline(numMatch[2])}</div>
            </div>
          );
        }

        return <p key={idx}>{formatInline(line)}</p>;
      })}
    </div>
  );
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll when new messages arrive (only when chat has content)
  useEffect(() => {
    if (open && (messages.length > 0 || loading || rooms.length > 0)) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, rooms, loading, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  async function executeSendMessage(textToSend: string) {
    const message = textToSend.trim();
    if (!message || loading) return;

    const previous = messages;

    setMessages((old) => [...old, { role: "user", text: message }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history: previous.slice(-20),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Chatbot không phản hồi");
      }

      setMessages((old) => [...old, { role: "model", text: data.reply }]);

      if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
        setRooms(data.rooms);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi kết nối với AI.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    executeSendMessage(input);
  }

  function handleQuickPrompt(promptText: string) {
    executeSendMessage(promptText);
  }

  function handleResetChat() {
    setMessages([]);
    setRooms([]);
    setError("");
  }

  return (
    <>
      {/* 1. Floating Trigger Button (Positioned cleanly below the duck mascot, no icons) */}
      {!open && (
        <aside
          className="fixed bottom-4 right-4 z-40 sm:bottom-5 sm:right-6 pointer-events-auto select-none"
          aria-label="Trợ lý tìm phòng AI"
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0F5132] via-[#059669] to-[#047857] pl-1.5 pr-3.5 py-1.5 sm:pl-2 sm:pr-4 sm:py-1.5 text-white shadow-lg shadow-emerald-950/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/30 active:scale-95 focus:outline-none"
            aria-label="Mở Trợ lý AI Trọ Ơi"
            title="Trợ lý AI tìm phòng"
          >
            <img
              src={MASCOT_IMG}
              alt="Avatar AI Trọ Ơi"
              className="size-6 sm:size-6.5 rounded-full object-cover border border-white/50 shadow-xs flex-shrink-0"
            />
            <span className="font-semibold text-xs tracking-wide">
              Tư vấn AI
            </span>
          </button>
        </aside>
      )}

      {/* 2. Interactive Chat Modal Window (Custom artwork & clean UI, no icon clutter) */}
      {open && (
        <section
          className="fixed bottom-4 right-4 z-50 flex h-[580px] max-h-[86vh] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-2xl shadow-emerald-950/30 animate-in fade-in slide-in-from-bottom-3 duration-200"
          aria-label="Cửa sổ tư vấn AI Trọ Ơi"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <header className="flex items-center justify-between bg-gradient-to-r from-[#0F5132] via-[#096a3f] to-[#059669] px-4 py-3 text-white shadow-sm">
            <div className="flex items-center gap-2.5">
              <img
                src={MASCOT_IMG}
                alt="Trợ lý Trọ Ơi"
                className="size-9 rounded-full object-cover border border-white/40 shadow-xs"
              />
              <div>
                <h3 className="font-bold text-sm leading-tight text-white">
                  Trợ lý AI Trọ Ơi
                </h3>
                <p className="text-[11px] text-emerald-100 mt-0.5">
                  Trực tuyến • Hỗ trợ tìm phòng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="rounded-lg px-2 py-1 text-xs text-emerald-100 hover:bg-white/15 hover:text-white transition"
                  title="Làm mới đoạn chat"
                >
                  Làm mới
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white/90 hover:bg-white/20 transition"
                aria-label="Đóng cửa sổ chat"
              >
                Đóng
              </button>
            </div>
          </header>

          {/* Messages & Content Area */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-4 bg-gradient-to-b from-[#f9fbfa] to-white">
            {/* Welcome banner when no messages */}
            {messages.length === 0 && (
              <div className="space-y-4 pt-1">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-center shadow-xs">
                  <div className="mx-auto mb-2.5 flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-300 bg-white shadow-xs">
                    <img
                      src={MASCOT_IMG}
                      alt="Vịt Trọ Ơi"
                      className="size-full object-cover object-top"
                    />
                  </div>
                  <h4 className="font-bold text-sm text-[#0F5132]">
                    Xin chào! Mình là Trợ lý Trọ Ơi
                  </h4>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                    Bạn cần tìm trọ khu vực nào, tầm giá bao nhiêu hoặc có yêu cầu gì không? Hãy nhắn cho mình nhé!
                  </p>
                </div>

                {/* Quick Prompts with Category Tags (No Emojis / No Icons) */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Gợi ý câu hỏi nhanh:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleQuickPrompt(prompt)}
                        className="rounded-xl border border-gray-200/80 bg-white px-3.5 py-2.5 text-left text-xs font-medium text-gray-700 shadow-xs transition hover:border-[#059669] hover:bg-emerald-50/40 hover:text-[#0F5132]"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((item, index) => (
              <div
                key={index}
                className={
                  item.role === "user"
                    ? "flex justify-end"
                    : "flex items-start gap-2.5"
                }
              >
                {item.role === "model" && (
                  <img
                    src={MASCOT_IMG}
                    alt="AI"
                    className="size-7 rounded-full object-cover border border-emerald-200 flex-shrink-0 shadow-2xs"
                  />
                )}
                <div
                  className={
                    item.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-tr-xs bg-gradient-to-r from-[#0F5132] to-[#059669] px-3.5 py-2.5 text-white shadow-sm"
                      : "max-w-[85%] rounded-2xl rounded-tl-xs border border-gray-200/80 bg-white px-3.5 py-2.5 text-gray-800 shadow-xs"
                  }
                >
                  <FormattedMessage
                    content={item.text}
                    isUser={item.role === "user"}
                  />
                </div>
              </div>
            ))}

            {/* Recommended Room Cards */}
            {rooms.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0F5132]">
                  Phòng trọ phù hợp nhất:
                </div>

                <div className="space-y-2">
                  {rooms.map((room) => (
                    <a
                      key={room.id}
                      href={`/phong/${encodeURIComponent(room.id)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group block rounded-2xl border border-emerald-100 bg-white p-3 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-[#059669] hover:shadow-md text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-xs text-gray-900 line-clamp-1 group-hover:text-[#0F5132] transition-colors">
                          {room.title}
                        </h4>
                        {room.price_vnd != null && (
                          <span className="flex-shrink-0 rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-bold text-[#0F5132]">
                            {Number(room.price_vnd).toLocaleString("vi-VN")}đ/th
                          </span>
                        )}
                      </div>

                      {room.location && (
                        <p className="mt-1 text-[11px] text-gray-500 line-clamp-1">
                          Địa chỉ: {room.location}
                        </p>
                      )}

                      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-1.5 text-[10px]">
                        <span className="text-gray-400">
                          Mã: #{room.id.slice(0, 8)}
                        </span>
                        <span className="font-semibold text-[#059669] group-hover:underline">
                          Xem chi tiết phòng →
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-[#0F5132] max-w-[85%]">
                <span className="flex gap-1">
                  <span
                    className="size-1.5 rounded-full bg-[#059669] animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="size-1.5 rounded-full bg-[#059669] animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="size-1.5 rounded-full bg-[#059669] animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
                <span>Đang tìm phòng phù hợp...</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer with Clean Text Button */}
          <footer className="border-t border-gray-150 bg-white p-3">
            <form onSubmit={handleFormSubmit} className="relative flex items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập nhu cầu tìm phòng..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 py-2.5 pl-3.5 pr-16 text-xs text-gray-800 placeholder-gray-400 transition focus:border-[#059669] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                maxLength={1000}
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-1.5 rounded-xl bg-gradient-to-r from-[#0F5132] to-[#059669] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:opacity-95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Gửi
              </button>
            </form>

            <div className="mt-1.5 flex items-center justify-center text-[10px] text-gray-400">
              <span>Trợ lý hỗ trợ tìm phòng tự động Trọ Ơi</span>
            </div>
          </footer>
        </section>
      )}
    </>
  );
}
