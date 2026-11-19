import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

BLACK = RGBColor(0, 0, 0)

def set_cell_white(cell):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="FFFFFF"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_academic_grid_borders(table):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>\n'
        f'  <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>\n'
        f'  <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>\n'
        f'  <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>\n'
        f'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>\n'
        f'  <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>\n'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_final_doc():
    # 1. Mở file gốc của nhóm để lấy nguyên vẹn TRANG BÌA CÓ KHUNG VIỀN HOA VĂN CHUẨN
    template_path = r"D:\KLTN\Nhom04_CLCTV_NguyenMinhQuocKhanh_PhamMinhKhanh_HoangThanhTu.docx"
    doc = docx.Document(template_path)

    # Xóa sạch các bảng của file cũ
    for t in list(doc.tables):
        t._tbl.getparent().remove(t._tbl)

    # Giữ lại đúng 22 đoạn đầu tiên (Trang bìa có khung hoa văn, logo, tên đề tài, thông tin nhóm)
    for p in list(doc.paragraphs[22:]):
        p._p.getparent().remove(p._p)

    # Cập nhật năm ở dòng cuối bìa
    p_last = doc.paragraphs[21]
    for r in p_last.runs:
        if "tháng 09 năm" in r.text or "tháng 11 năm" in r.text:
            r.text = "Hồ Chí Minh, tháng 11 năm 2026"

    # Helper functions cho nội dung báo cáo từ trang 2
    def add_h1(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13.5)
        r.font.bold = True
        r.font.color.rgb = BLACK
        return p

    def add_h2(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = BLACK
        return p

    def add_body_p(text, bold_prefix="", indent=True):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.18
        if indent:
            p.paragraph_format.first_line_indent = Pt(18)
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = 'Times New Roman'
            rb.font.size = Pt(13)
            rb.font.bold = True
            rb.font.color.rgb = BLACK
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)
        r.font.color.rgb = BLACK
        return p

    def add_dash_p(text, bold_prefix=""):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.18
        p.paragraph_format.left_indent = Pt(18)
        p.paragraph_format.first_line_indent = Pt(-12)
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = 'Times New Roman'
            rb.font.size = Pt(13)
            rb.font.bold = True
            rb.font.color.rgb = BLACK
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)
        r.font.color.rgb = BLACK
        return p

    # Tiêu đề tài liệu ở trang 2
    p_header_doc = doc.add_paragraph()
    p_header_doc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_header_doc.paragraph_format.space_before = Pt(6)
    p_header_doc.paragraph_format.space_after = Pt(6)
    p_header_doc.paragraph_format.line_spacing = 1.25

    r_hdoc = p_header_doc.add_run("BÁO CÁO MỤC TIÊU ĐỀ TÀI & TÍNH THỰC TIỄN\n(ĐÁNH GIÁ MỤC TIÊU & TÍNH THỰC TIỄN CỦA ĐỀ TÀI)")
    r_hdoc.font.name = 'Times New Roman'
    r_hdoc.font.size = Pt(14)
    r_hdoc.font.bold = True
    r_hdoc.font.color.rgb = BLACK

    # Thông tin nhóm & đề tài
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_meta.paragraph_format.space_before = Pt(2)
    p_meta.paragraph_format.space_after = Pt(12)
    p_meta.paragraph_format.line_spacing = 1.25

    runs_meta = [
        ("- Đề tài: ", True),
        ("Xây dựng website hỗ trợ tìm kiếm, chia sẻ và chuyển nhượng phòng trọ (Nền tảng \"Trọ Ơi\")\n", False),
        ("- Giảng viên hướng dẫn: ", True),
        ("TS. Lê Văn Vinh\n", False),
        ("- Nhóm sinh viên thực hiện: ", True),
        ("Nhóm 04 (Lớp: CLC Tiếng Việt) — Khoa Đào tạo Chất lượng cao, HCMUTE\n", False),
        ("  + Nguyễn Minh Quốc Khánh (Nhóm trưởng) — MSSV: 23110113\n", False),
        ("  + Phạm Minh Khánh — MSSV: 23110114\n", False),
        ("  + Hoàng Thanh Tú — MSSV: 23110167", False)
    ]
    for m_text, m_bold in runs_meta:
        rm = p_meta.add_run(m_text)
        rm.font.name = 'Times New Roman'
        rm.font.size = Pt(12)
        rm.font.bold = m_bold
        rm.font.color.rgb = BLACK

    # =============================================================
    # I. MỤC TIÊU CỦA ĐỀ TÀI (RÕ RÀNG, DỨT KHOÁT)
    # =============================================================
    add_h1("I. MỤC TIÊU CỦA ĐỀ TÀI")

    add_h2("1.1. Mục tiêu tổng quát")
    add_body_p(
        "Mục tiêu cốt lõi của đề tài là xây dựng hoàn chỉnh website \"Trọ Ơi\" nhằm giải quyết bài toán khép kín: "
        "kết nối người thuê và chủ trọ thông qua tìm kiếm bản đồ trực quan, minh bạch hóa chi phí, hỗ trợ nhắn tin trực tiếp, "
        "đồng thời xây dựng diễn đàn cộng đồng chuyên biệt để sinh viên dễ dàng chuyển nhượng (pass) phòng trọ khi cần chuyển đi trước hạn hợp đồng "
        "và tìm người ở ghép phù hợp."
    )

    add_h2("1.2. Mục tiêu cụ thể về Chức năng nghiệp vụ")
    add_body_p("Hệ thống giải quyết 4 nhóm nghiệp vụ chính tương ứng với các tác nhân:")

    add_dash_p(
        "Tìm kiếm theo khu vực hành chính hoặc theo vị trí GPS thực tế trong bán kính mong muốn (1km – 10km quanh trường học); "
        "lọc theo giá thuê, diện tích và tiện ích; xem vị trí phòng trên bản đồ OpenStreetMap/Leaflet; xem chi tiết giá điện, nước, tiền cọc rõ ràng.",
        "- Về Tìm kiếm phòng trọ: "
    )

    add_dash_p(
        "Lưu danh sách phòng yêu thích; đánh giá sao và bình luận thực tế (chỉ áp dụng cho người đã/đang thuê phòng để tránh đánh giá ảo); "
        "nhắn tin trực tiếp thời gian thực (Chat real-time) với chủ trọ hoặc người pass phòng; gửi báo cáo khi phát hiện tin giả mạo.",
        "- Về Tương tác của Người thuê: "
    )

    add_dash_p(
        "Tạo không gian để sinh viên đăng bài chia sẻ kinh nghiệm ở trọ; đăng bài sang nhượng cọc/hợp đồng (pass phòng) khi chuyển chỗ ở trước hạn; "
        "đăng tin tìm bạn cùng phòng tương thích thói quen sinh hoạt.",
        "- Về Diễn đàn & Pass phòng (Điểm mới cốt lõi): "
    )

    add_dash_p(
        "Chủ trọ đăng tin cho thuê, quản lý trạng thái phòng (đang hiển thị, đã cho thuê), xem thống kê lượt xem và liên hệ. "
        "Quản trị viên (Admin) kiểm duyệt tin đăng phòng trọ, kiểm duyệt bài viết diễn đàn, xử lý báo cáo vi phạm và quản lý tài khoản người dùng.",
        "- Về Quản lý & Kiểm duyệt (Chủ trọ & Admin): "
    )

    add_h2("1.3. Mục tiêu cụ thể về Kỹ thuật và Công nghệ")
    add_dash_p(
        "Giao diện Single Page Application (SPA) xây dựng bằng ReactJS 19, TypeScript và Vite, đảm bảo tốc độ phản hồi nhanh và tương thích hoàn toàn trên thiết bị di động.",
        "- Phía Client (Frontend): "
    )
    add_dash_p(
        "Xây dựng bằng NodeJS và ExpressJS theo chuẩn RESTful API, phân tách rõ ràng Controller – Service – Repository để dễ kiểm thử và bảo trì.",
        "- Phía Server (Backend): "
    )
    add_dash_p(
        "Sử dụng mô hình dữ liệu kết hợp: PostgreSQL + PostGIS quản lý dữ liệu quan hệ và tính toán khoảng cách GPS nhanh chóng; MongoDB lưu trữ dữ liệu tin nhắn chat và thông báo thời gian thực.",
        "- Phía Cơ sở dữ liệu: "
    )
    add_dash_p(
        "Ứng dụng Socket.IO truyền nhận tin nhắn tức thì hai chiều giữa người thuê và chủ nhà; mã hóa mật khẩu một chiều BCrypt và xác thực phân quyền bằng JWT (JSON Web Token).",
        "- Về Giao tiếp & Bảo mật: "
    )

    # =============================================================
    # II. TÍNH THỰC TIỄN CỦA ĐỀ TÀI
    # =============================================================
    add_h1("II. TÍNH THỰC TIỄN CỦA ĐỀ TÀI")

    add_h2("2.1. Vấn đề thực tế cần giải quyết")
    add_body_p(
        "Sinh viên và người lao động trẻ tại TP.HCM (với hơn 500.000 sinh viên tại các cụm trường đại học) thường xuyên gặp phải 3 vấn đề lớn:"
    )
    add_dash_p(
        "Tìm phòng trên các nhóm mạng xã hội tự do rất dễ gặp tin đăng ảo của môi giới, hình ảnh phòng khác xa thực tế hoặc bị lừa chuyển tiền cọc giữ chỗ.",
        "1. Thông tin thiếu minh bạch và rủi ro lừa đảo: "
    )
    add_dash_p(
        "Hợp đồng thuê phòng thường ký từ 6 đến 12 tháng. Khi sinh viên đổi cơ sở học, chuyển nơi thực tập hoặc về quê đột xuất, việc chấm dứt hợp đồng sớm đồng nghĩa với việc mất trắng tiền cọc (thường từ 2 đến 10 triệu đồng) do không có kênh sang nhượng chính thống.",
        "2. Rủi ro mất trắng tiền cọc khi dọn đi trước hạn: "
    )
    add_dash_p(
        "Người đi thuê thường phải gọi điện thoại trực tiếp hoặc qua Zalo, không có kênh trao đổi tập trung và không có cơ chế đánh giá mức độ uy tín của chủ trọ từ những người đã từng ở trước đó.",
        "3. Thiếu kênh tương tác và đánh giá xác thực: "
    )

    add_h2("2.2. Giá trị và Giải pháp thực tế của đề tài")
    
    # BẢNG TỔNG HỢP GIÁ TRỊ THỰC TIỄN (TRẮNG 100%, VIỀN ĐEN, GẠCH DÒNG)
    table_val = doc.add_table(rows=4, cols=2)
    table_val.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_val.autofit = False
    set_academic_grid_borders(table_val)

    val_headers = table_val.rows[0]
    val_headers.cells[0].width = Inches(2.2)
    val_headers.cells[1].width = Inches(4.3)
    set_cell_white(val_headers.cells[0])
    set_cell_white(val_headers.cells[1])
    set_cell_margins(val_headers.cells[0])
    set_cell_margins(val_headers.cells[1])
    
    p_vh0 = val_headers.cells[0].paragraphs[0]
    p_vh0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_vh0 = p_vh0.add_run("Đối tượng hưởng lợi")
    r_vh0.font.name = 'Times New Roman'
    r_vh0.font.size = Pt(12)
    r_vh0.font.bold = True
    r_vh0.font.color.rgb = BLACK

    p_vh1 = val_headers.cells[1].paragraphs[0]
    p_vh1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_vh1 = p_vh1.add_run("Giải pháp và Giá trị thực tế mang lại")
    r_vh1.font.name = 'Times New Roman'
    r_vh1.font.size = Pt(12)
    r_vh1.font.bold = True
    r_vh1.font.color.rgb = BLACK

    val_rows_data = [
        (
            "Người thuê trọ\n(Sinh viên, người đi làm)",
            "- Tiết kiệm thời gian tìm kiếm nhờ bản đồ GPS và bộ lọc đa tiêu chí.\n"
            "- Tránh rủi ro mất cọc: Đăng tin pass phòng trên diễn đàn để tìm người sang nhượng hợp đồng nhanh chóng.\n"
            "- Biết trước chính xác chi phí sinh hoạt (giá điện, nước, xe, cọc) trước khi đến xem phòng.\n"
            "- Yên tâm về chất lượng nhờ đánh giá từ người thuê trước và tin đã qua Admin duyệt."
        ),
        (
            "Chủ nhà trọ\n(Hộ gia đình, chủ nhà)",
            "- Tiếp cận trực tiếp sinh viên có nhu cầu thuê thật, không mất phí môi giới trung gian.\n"
            "- Quản lý danh sách phòng cho thuê, cập nhật trạng thái phòng trống/đã thuê chỉ với vài thao tác.\n"
            "- Trao đổi trực tiếp với khách thuê qua tính năng chat tích hợp sẵn."
        ),
        (
            "Cộng đồng sinh viên\n& Xã hội",
            "- Tạo lập môi trường chia sẻ thông tin nhà trọ minh bạch, hỗ trợ lẫn nhau trong đời sống sinh viên.\n"
            "- Giảm thiểu các vụ việc tranh chấp hợp đồng và lừa đảo cọc trên địa bàn các làng đại học."
        )
    ]

    for idx, (grp, cont) in enumerate(val_rows_data):
        row = table_val.rows[idx + 1]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        set_cell_white(c0)
        set_cell_white(c1)
        set_cell_margins(c0)
        set_cell_margins(c1)
        
        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r0 = p0.add_run(grp)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(12)
        r0.font.bold = True
        r0.font.color.rgb = BLACK

        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r1 = p1.add_run(cont)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(12)
        r1.font.color.rgb = BLACK
        p1.paragraph_format.line_spacing = 1.25

    # =============================================================
    # III. SỰ HIỂU BIẾT VỀ VẤN ĐỀ NGHIÊN CỨU
    # =============================================================
    add_h1("III. SỰ HIỂU BIẾT VỀ VẤN ĐỀ NGHIÊN CỨU")

    add_h2("3.1. Phân tích khoảng trống của các hệ thống hiện có")
    add_body_p(
        "Nhóm đã khảo sát thực tế 4 nền tảng tìm phòng trọ phổ biến tại Việt Nam (Phongtro123.com, Chợ Tốt Nhà, Ohana, Mogi.vn) "
        "và rút ra điểm khác biệt cốt lõi của đề tài:"
    )

    # BẢNG SO SÁNH NGẮN GỌN (TRẮNG 100%, VIỀN ĐEN)
    table_comp = doc.add_table(rows=5, cols=3)
    table_comp.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_comp.autofit = False
    set_academic_grid_borders(table_comp)

    headers_comp = ["Tính năng", "Các nền tảng hiện có (Phongtro123, Chợ Tốt, Ohana, Mogi)", "Nền tảng Trọ Ơi của đề tài"]
    widths_comp = [Inches(1.8), Inches(2.3), Inches(2.4)]

    row_h = table_comp.rows[0]
    for c_idx, title in enumerate(headers_comp):
        cell = row_h.cells[c_idx]
        cell.width = widths_comp[c_idx]
        set_cell_white(cell)
        set_cell_margins(cell)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = BLACK

    comp_data = [
        ("Mô hình hoạt động", "Chủ yếu là sàn rao vặt 1 chiều; người thuê xem tin và tự gọi điện thoại ra ngoài.", "Kết hợp tìm kiếm phòng trọ với mạng xã hội cộng đồng và kênh chat trực tiếp."),
        ("Chuyển nhượng cọc (Pass phòng)", "Không hỗ trợ; người thuê muốn chuyển đi trước hạn tự chịu mất cọc.", "Tích hợp chuyên mục Pass phòng trên diễn đàn, hỗ trợ sang tên cọc minh bạch."),
        ("Tương tác & Đánh giá", "Không có đánh giá từ người thuê thật hoặc chỉ chat được với ban quản trị.", "Đánh giá xếp hạng sao thực tế từ người đã thuê; nhắn tin real-time trực tiếp."),
        ("Kiểm duyệt nội dung", "Nhiều tin ảo, tin môi giới trùng lặp chưa được xử lý triệt để.", "Admin kiểm duyệt 100% tin phòng mới và rà soát bài viết vi phạm trên diễn đàn.")
    ]

    for r_idx, (feat, exist, ours) in enumerate(comp_data):
        row = table_comp.rows[r_idx + 1]
        for c_idx, val in enumerate([feat, exist, ours]):
            cell = row.cells[c_idx]
            cell.width = widths_comp[c_idx]
            set_cell_white(cell)
            set_cell_margins(cell)
            p = cell.paragraphs[0]
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                r = p.add_run(val)
                r.font.bold = True
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            r.font.color.rgb = BLACK
            p.paragraph_format.line_spacing = 1.2

    add_h2("3.2. Mức độ làm chủ quy trình và công nghệ thực hiện")
    add_dash_p(
        "Hoàn thành phân tích 56 Use Cases cho cả phân hệ người dùng và quản trị; thiết kế lược đồ lớp và 34 lược đồ tuần tự mô tả chi tiết luồng dữ liệu.",
        "- Về Phân tích & Thiết kế hệ thống: "
    )
    add_dash_p(
        "Khai thác hàm không gian ST_DWithin và chỉ mục GIST của PostGIS trên PostgreSQL để tìm phòng theo bán kính GPS cực nhanh; "
        "kết hợp MongoDB để tối ưu việc lưu trữ và truy vấn lịch sử tin nhắn chat theo thời gian thực.",
        "- Về Cơ sở dữ liệu: "
    )
    add_dash_p(
        "Đề tài đã hoàn thành việc lập trình thực tế trên toàn bộ mã nguồn (thư mục Tro-Oi-code), xây dựng 46 kịch bản kiểm thử chức năng (TC-01 đến TC-46) và chạy thử nghiệm mượt mà tại môi trường local.",
        "- Về Kết quả thực thi: "
    )

    # Chữ ký xác nhận gọn gàng
    p_sign_sp = doc.add_paragraph()
    p_sign_sp.paragraph_format.space_before = Pt(12)
    p_sign_sp.paragraph_format.space_after = Pt(2)

    t_sign = doc.add_table(rows=2, cols=2)
    t_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_sign.autofit = False
    
    r0 = t_sign.rows[0]; r1 = t_sign.rows[1]
    set_cell_white(r0.cells[0]); set_cell_white(r0.cells[1])
    set_cell_white(r1.cells[0]); set_cell_white(r1.cells[1])
    r0.cells[0].width = Inches(3.2); r0.cells[1].width = Inches(3.2)
    r1.cells[0].width = Inches(3.2); r1.cells[1].width = Inches(3.2)

    p0 = r0.cells[0].paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r0_text = p0.add_run("XÁC NHẬN CỦA GVHD\n(Ký và ghi rõ họ tên)")
    r0_text.font.name = 'Times New Roman'; r0_text.font.size = Pt(12); r0_text.font.bold = True; r0_text.font.color.rgb = BLACK

    p1 = r0.cells[1].paragraphs[0]
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1_text = p1.add_run("TP. Hồ Chí Minh, ngày 20 tháng 11 năm 2026\nĐẠI DIỆN NHÓM THỰC HIỆN\n(Ký và ghi rõ họ tên)")
    r1_text.font.name = 'Times New Roman'; r1_text.font.size = Pt(12); r1_text.font.bold = True; r1_text.font.color.rgb = BLACK

    p0_b = r1.cells[0].paragraphs[0]
    p0_b.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0_b.paragraph_format.space_before = Pt(38)
    r0_b = p0_b.add_run("TS. LÊ VĂN VINH")
    r0_b.font.name = 'Times New Roman'; r0_b.font.size = Pt(13); r0_b.font.bold = True; r0_b.font.color.rgb = BLACK

    p1_b = r1.cells[1].paragraphs[0]
    p1_b.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1_b.paragraph_format.space_before = Pt(38)
    r1_b = p1_b.add_run("Nguyễn Minh Quốc Khánh")
    r1_b.font.name = 'Times New Roman'; r1_b.font.size = Pt(13); r1_b.font.bold = True; r1_b.font.color.rgb = BLACK

    # Lưu file
    out1 = r"d:\KLTN\Tro-Oi-code\Bao_Cao_Muc_Tieu_De_Tai_Nhom04_TroOi.docx"
    doc.save(out1)
    print("Saved:", out1)

    out2 = r"d:\KLTN\Bao_Cao_Muc_Tieu_De_Tai_Nhom04_TroOi.docx"
    try:
        shutil.copyfile(out1, out2)
        print("Saved:", out2)
    except Exception as e:
        print("Cannot copy to out2:", e)

    out3 = r"C:\Users\light\.gemini\antigravity\brain\c276acd3-54bb-4187-aaa8-cefb02574ef9\Bao_Cao_Muc_Tieu_De_Tai_Nhom04_TroOi.docx"
    try:
        shutil.copyfile(out1, out3)
        print("Saved:", out3)
    except Exception as e:
        print("Cannot copy to out3:", e)

if __name__ == '__main__':
    build_final_doc()
