
import { Router } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { pool } from "../config/db.js";

const router = Router();

const MODEL =
    process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const gemini = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    })
    : null;

const TOOL_DECLARATIONS = [
    {
        name: "search_rooms",
        description:
            "Tìm phòng trọ thật trong Tro-Oi bằng yêu cầu tiếng Việt. " +
            "Chỉ gọi khi đã có đủ thông tin phù hợp. " +
            "Query phải tổng hợp cả những yêu cầu từ lượt trước.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                query: {
                    type: Type.STRING,
                    description:
                        "Câu tìm kiếm đầy đủ bằng tiếng Việt, " +
                        "bao gồm khu vực, ngân sách và tiện ích"
                }
            },
            required: ["query"]
        }
    },
    {
        name: "get_room_details",
        description:
            "Lấy thông tin chi tiết một phòng trong Tro-Oi " +
            "theo ID phòng đã tìm được.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                room_id: {
                    type: Type.STRING,
                    description: "ID phòng trong database"
                }
            },
            required: ["room_id"]
        }
    }
];

// Công cụ 1: Tái sử dụng AI Search hiện tại
async function searchRooms(query) {
    if (
        typeof query !== "string" ||
        !query.trim() ||
        query.length > 1000
    ) {
        return { error: "Câu tìm kiếm không hợp lệ" };
    }

    const port = Number(process.env.PORT || 3001);

    const response = await fetch(
        `http://127.0.0.1:${port}/api/ai/search`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query }),
            signal: AbortSignal.timeout(90000)
        }
    );

    const data = await response.json();

    if (!response.ok) {
        return {
            error: data.error || "Tìm kiếm phòng thất bại",
            status: response.status
        };
    }

    return {
        total: data.total,
        filters: data.filters,
        items: (data.items || []).slice(0, 5).map(room => ({
            id: room.id,
            title: room.title,
            location: room.location,
            price_vnd: room.price_vnd ?? (Number(room.priceValue) * 1_000_000),
            amenities: room.amenities,
            description: room.description,
            aiScore: room.aiScore,
            image_url: room.image_url ?? room.image
        }))
    };
}

// Công cụ 2: Chi tiết phòng theo ID
async function getRoomDetails(roomId) {
    if (
        typeof roomId !== "string" ||
        !roomId.trim() ||
        roomId.length > 128
    ) {
        return { error: "ID phòng không hợp lệ" };
    }

    const result = await pool.query(
        `SELECT
       id, title, description, location,
       price_vnd, area_m2, room_type,
       amenities, image_url, status
     FROM listings
     WHERE id = $1 AND status = 'active'
     LIMIT 1`,
        [roomId]
    );

    if (!result.rows.length) {
        return { error: "Không tìm thấy phòng đang hoạt động" };
    }

    return result.rows[0];
}

async function executeTool(name, args) {
    switch (name) {
        case "search_rooms":
            return searchRooms(args?.query);

        case "get_room_details":
            return getRoomDetails(args?.room_id);

        default:
            return { error: "Công cụ không được hỗ trợ" };
    }
}

// API chatbot
router.post("/chat", async (req, res) => {
    try {
        const { message, history = [] } = req.body ?? {};

        if (
            typeof message !== "string" ||
            !message.trim() ||
            message.length > 2000
        ) {
            return res.status(400).json({
                error: "Tin nhắn không hợp lệ"
            });
        }

        if (
            !Array.isArray(history) ||
            history.length > 20 ||
            !history.every(
                item =>
                    item &&
                    ["user", "model"].includes(item.role) &&
                    typeof item.text === "string" &&
                    item.text.length <= 2000
            )
        ) {
            return res.status(400).json({
                error: "Lịch sử trò chuyện không hợp lệ"
            });
        }

        if (!gemini) {
            return res.status(503).json({
                error: "Chưa cấu hình GEMINI_API_KEY"
            });
        }

        // Dựng lại hội thoại nhiều lượt
        const contents = [
            ...history.map(item => ({
                role: item.role,
                parts: [{ text: item.text }]
            })),
            {
                role: "user",
                parts: [{ text: message.trim() }]
            }
        ];

        const systemInstruction = `
Bạn là "Trợ lý AI Trọ Ơi" - trợ lý tư vấn tìm phòng trọ và giải đáp thắc mắc thuộc nền tảng công nghệ Trọ Ơi (Tro-Oi).
Giao tiếp bằng tiếng Việt tự nhiên, thân thiện, ngắn gọn và hữu ích.

=== 1. THÔNG TIN DỰ ÁN TRỌ ƠI ===
- Trọ Ơi là nền tảng kết nối người thuê và chủ nhà trọ uy tín, hỗ trợ sinh viên và người đi làm tìm phòng nhanh chóng, an toàn, minh bạch, phòng tránh lừa đảo cọc ảo.
- Dự án là Đề tài Khóa luận tốt nghiệp của Nhóm 04 (Nguyễn Minh Quốc Khánh, Phạm Minh Khánh, Hoàng Thanh Tú).
- Các tính năng chính trên website Trọ Ơi:
  + Tìm kiếm phòng trọ thông minh: Bộ lọc chi tiết theo tỉnh/thành, quận/huyện, mức giá (VNĐ/tháng), diện tích (m2), loại phòng (phòng trọ, căn hộ mini, nhà nguyên căn, ở ghép / KTX).
  + Bản đồ tương tác (Interactive Map): Xem phòng trực quan theo tọa độ địa lý, định vị bán kính quanh trường học, trạm xe buýt.
  + Diễn đàn sinh viên & Cộng đồng (Forum): Chia sẻ kinh nghiệm thuê trọ, tìm bạn ở ghép, đánh giá khu vực, đăng bài nhượng/pass phòng.
  + Nhắn tin trực tuyến (Realtime Chat): Trò chuyện tức thời với chủ trọ hoặc người đăng tin qua hệ thống chat tích hợp bảo mật.
  + Đánh giá & Báo cáo (Review & Report): Người thuê gửi đánh giá phòng thực tế và báo cáo các tin giả mạo/chủ trọ vi phạm để Admin xử lý.
  + Quản lý dành cho Chủ trọ: Đăng tin cho thuê, quản lý phòng trống, cập nhật giá điện nước.

=== 2. KIẾN THỨC ĐỊA BÀN & TRƯỜNG ĐẠI HỌC ===
- Khu vực TP. Thủ Đức & ĐHQG:
  + ĐH Sư Phạm Kỹ Thuật TP.HCM (HCMUTE / SPKT): Nằm trên trục đường Võ Văn Ngân, gần Đặng Văn Bi, Hoàng Diệu 2, Lê Văn Chí, ngã tư Thủ Đức. Khu trọ sinh viên nhiều ở phường Linh Chiểu, Linh Trung, Tăng Nhơn Phú. Giá trọ từ 1.8 - 3.5 triệu/tháng, căn hộ mini từ 3.5 - 5.5 triệu/tháng.
  + Làng Đại học Quốc Gia TP.HCM (ĐH Bách Khoa CS2, ĐH KHTN, ĐH KHXH&NV, ĐH CNTT, ĐH Kinh tế - Luật): Tập trung nhiều phòng trọ và ký túc xá giá rẻ từ 1.2 - 2.5 triệu/tháng quanh KTX Khu A, Khu B, đường Quảng Trường Sáng Tạo, Tô Vĩnh Diện, Tân Lập.
  + Khu Công Nghệ Cao (SHTP): Tuyến đường Lê Văn Việt, Lã Xuân Oai, Long Trường, Tăng Nhơn Phú.
- Khu vực Bình Thạnh:
  + Tập trung ĐH HUTECH, UEF, ĐH Ngoại Thương CS2, ĐH Giao Thông Vận Tải.
  + Tuyến đường trọ: Điện Biên Phủ, Nguyễn Gia Trí (D2 cũ), Ung Văn Khiêm, Xô Viết Nghệ Tĩnh, Phan Văn Trị, Nơ Trang Long. Giá từ 2.2 - 5 triệu/tháng.
- Khu vực Quận 10 & Quận 3:
  + ĐH Bách Khoa CS1 (Lý Thường Kiệt), ĐH Kinh Tế TP.HCM (UEH), ĐH Sư Phạm. Giá trọ trung tâm từ 3 - 6 triệu/tháng.

=== 3. CẨM NANG THUÊ TRỌ AN TOÀN ===
- Luôn đến tận nơi xem phòng, kiểm tra nhà vệ sinh, nguồn nước, đồng hồ điện và an ninh khu vực trước khi đặt cọc.
- Tuyệt đối không chuyển tiền cọc giữ phòng qua mạng cho người lạ khi chưa ký kết hợp đồng hoặc chưa xác minh chủ nhà.
- Kiểm tra rõ chi phí phụ: Giá điện (theo nhà nước hoặc 3.500 - 4.000đ/kWh), nước (20.000 - 30.000đ/m3 hoặc tính theo người), phí wifi, vệ sinh, giữ xe.
- Khuyến khích dùng tính năng Báo cáo trên Trọ Ơi nếu phát hiện tin giả mạo.

=== 4. QUY TẮC PHẢN HỒI CỦA TRỢ LÝ ===
1. Khi người dùng hỏi về dự án, cách sử dụng website, trường học, hay kinh nghiệm thuê trọ: Trả lời tự tin, súc tích và chuẩn xác dựa trên thông tin trên.
2. Khi người dùng tìm phòng:
   - Nếu chưa rõ khu vực hoặc mức giá, hỏi thêm thông tin ngắn gọn.
   - Khi có nhu cầu cụ thể, gọi công cụ 'search_rooms' để tìm phòng THẬT trong cơ sở dữ liệu.
   - Chỉ giới thiệu phòng lấy được từ công cụ 'search_rooms', KHÔNG tự bịa phòng trọ không có trong hệ thống.
3. Phong cách trình bày:
   - Viết câu văn gãy gọn, tự nhiên, hạn chế lạm dụng quá nhiều dấu hoa thị (**) hoặc danh sách lồng nhau gây rối mắt.
   - Giao diện người dùng sẽ tự động hiển thị thẻ card tương tác cho từng phòng (có tên, giá, địa chỉ và nút bấm), vì vậy trong lời nhắn bạn chỉ cần tóm tắt ngắn gọn và giới thiệu các điểm nổi bật nhất.
4. Tuyệt đối không yêu cầu người dùng cung cấp mật khẩu, mã OTP hay thông tin tài khoản ngân hàng.
`;

        const config = {
            systemInstruction,
            tools: [
                { functionDeclarations: TOOL_DECLARATIONS }
            ],
            temperature: 0.3
        };

        let response = await gemini.models.generateContent({
            model: MODEL,
            contents,
            config
        });

        let rooms = [];
        let toolUsed = false;

        // Tối đa hai vòng gọi công cụ trong một lượt
        for (let step = 0; step < 2; step++) {
            const calls = response.functionCalls || [];

            if (calls.length === 0) break;

            const modelContent = response.candidates?.[0]?.content;
            if (!modelContent) {
                throw new Error("Gemini thiếu nội dung gọi công cụ");
            }

            contents.push(modelContent);

            const toolParts = [];

            for (const call of calls.slice(0, 3)) {
                const result = await executeTool(
                    call.name,
                    call.args || {}
                );

                toolUsed = true;

                if (call.name === "search_rooms" && result.items) {
                    rooms = result.items;
                }

                if (
                    call.name === "get_room_details" &&
                    result.id
                ) {
                    rooms = [result];
                }

                toolParts.push({
                    functionResponse: {
                        name: call.name,
                        ...(call.id ? { id: call.id } : {}),
                        response: { result }
                    }
                });
            }

            contents.push({
                role: "user",
                parts: toolParts
            });

            response = await gemini.models.generateContent({
                model: MODEL,
                contents,
                config
            });
        }

        if (response.functionCalls?.length) {
            throw new Error("Vượt quá số vòng gọi công cụ");
        }

        const reply =
            response.text?.trim() ||
            "Mình chưa thể trả lời lúc này, bạn thử lại nhé.";

        return res.json({
            reply,
            rooms,
            toolUsed
        });

    } catch (error) {
        console.error("AI Chat Error:", error);

        return res.status(502).json({
            error: "Chatbot hiện chưa thể xử lý yêu cầu"
        });
    }
});

export default router;
