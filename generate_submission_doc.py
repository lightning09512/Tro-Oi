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

def build_focused_document():
    doc = docx.Document()

    # Căn lề chuẩn A4 luận văn HCMUTE: Trái 3.0cm, Trên/Dưới/Phải 2.0cm
    for section in doc.sections:
        section.top_margin = Inches(0.79)
        section.bottom_margin = Inches(0.79)
        section.left_margin = Inches(1.18)
        section.right_margin = Inches(0.79)
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)

    # Style Normal mặc định: 13pt Times New Roman, màu đen
    normal_style = doc.styles['Normal']
    normal_font = normal_style.font
    normal_font.name = 'Times New Roman'
    normal_font.size = Pt(13)
    normal_font.color.rgb = BLACK

    # =============================================================
    # 1. TRANG BÌA GỌN GÀNG, TRANG TRỌNG
    # =============================================================
    p_header = doc.add_paragraph()
    p_header.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_header.paragraph_format.space_before = Pt(0)
    p_header.paragraph_format.space_after = Pt(2)
    p_header.paragraph_format.line_spacing = 1.15
    
    r1 = p_header.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO\n")
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(12)
    r1.font.bold = True
    r1.font.color.rgb = BLACK

    r2 = p_header.add_run("TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT TP. HỒ CHÍ MINH\n")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(13)
    r2.font.bold = True
    r2.font.color.rgb = BLACK

    r3 = p_header.add_run("KHOA ĐÀO TẠO CHẤT LƯỢNG CAO — NGÀNH CÔNG NGHỆ THÔNG TIN\n")
    r3.font.name = 'Times New Roman'
    r3.font.size = Pt(12)
    r3.font.bold = True
    r3.font.color.rgb = BLACK

    r_div = p_header.add_run("---------***---------")
    r_div.font.name = 'Times New Roman'
    r_div.font.size = Pt(12)
    r_div.font.bold = True
    r_div.font.color.rgb = BLACK

    # Logo trường
    logo_path = r"D:\KLTN\ch4_work\extracted_logos\word\media\image1.jpeg"
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(12)
        p_logo.paragraph_format.space_after = Pt(16)
        p_logo.add_run().add_picture(logo_path, width=Inches(1.8))

    p_doc_type = doc.add_paragraph()
    p_doc_type.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_doc_type.paragraph_format.space_before = Pt(6)
    p_doc_type.paragraph_format.space_after = Pt(8)
    r_dt = p_doc_type.add_run("BÁO CÁO MỤC TIÊU ĐỀ TÀI & TÍNH THỰC TIỄN\nTIỂU LUẬN CHUYÊN NGÀNH / KHÓA LUẬN TỐT NGHIỆP")
    r_dt.font.name = 'Times New Roman'
    r_dt.font.size = Pt(13)
    r_dt.font.bold = True
    r_dt.font.color.rgb = BLACK

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(10)
    p_title.paragraph_format.space_after = Pt(8)
    p_title.paragraph_format.line_spacing = 1.25

    r_title = p_title.add_run("ĐỀ TÀI:\nXÂY DỰNG WEBSITE HỖ TRỢ TÌM KIẾM, CHIA SẺ\nVÀ CHUYỂN NHƯỢNG PHÒNG TRỌ (NỀN TẢNG \"TRỌ ƠI\")")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(14.5)
    r_title.font.bold = True
    r_title.font.color.rgb = BLACK

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(4)
    p_sub.paragraph_format.space_after = Pt(28)
    r_sub = p_sub.add_run("Nội dung đánh giá: Tính thực tiễn của đề tài và sự hiểu biết về vấn đề nghiên cứu\n(Xác nhận mục tiêu đề tài theo yêu cầu của Giảng viên hướng dẫn)")
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(11.5)
    r_sub.font.italic = True
    r_sub.font.color.rgb = BLACK

    # Bảng thông tin nhóm & GVHD
    table_cover = doc.add_table(rows=6, cols=2)
    table_cover.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_cover.autofit = False

    cover_data = [
        ("Giảng viên hướng dẫn:", "TS. Lê Văn Vinh"),
        ("Đơn vị đào tạo:", "Khoa Đào tạo Chất lượng cao — HCMUTE"),
        ("Nhóm sinh viên thực hiện:", "Nhóm 04 (Lớp: CLC Tiếng Việt)"),
        ("Sinh viên 1 (Nhóm trưởng):", "Nguyễn Minh Quốc Khánh — MSSV: 23110113"),
        ("Sinh viên 2:", "Phạm Minh Khánh — MSSV: 23110114"),
        ("Sinh viên 3:", "Hoàng Thanh Tú — MSSV: 23110167"),
    ]

    for idx, (label, val) in enumerate(cover_data):
        row = table_cover.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.5)
        c1.width = Inches(3.8)
        set_cell_white(c0)
        set_cell_white(c1)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(2)
        p0.paragraph_format.space_after = Pt(2)
        r0 = p0.add_run(label)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(12)
        r0.font.bold = True
        r0.font.color.rgb = BLACK

        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(2)
        p1.paragraph_format.space_after = Pt(2)
        r1 = p1.add_run(val)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(12)
        r1.font.color.rgb = BLACK
        if idx in (0, 2):
            r1.font.bold = True

    p_city = doc.add_paragraph()
    p_city.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_city.paragraph_format.space_before = Pt(40)
    p_city.paragraph_format.space_after = Pt(0)
    r_city = p_city.add_run("TP. HỒ CHÍ MINH, THÁNG 11 NĂM 2026")
    r_city.font.name = 'Times New Roman'
    r_city.font.size = Pt(12)
    r_city.font.bold = True
    r_city.font.color.rgb = BLACK

    doc.add_page_break()

    # =============================================================
    # 2. HÀM VIẾT NỘI DUNG CÔ ĐỌNG, ĐÚNG TRỌNG TÂM
    # =============================================================
    
    def add_h1(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13.5)
        r.font.bold = True
        r.font.color.rgb = BLACK
        return p

    def add_h2(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
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
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.3
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
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.3
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

    # =============================================================
    # NỘI DUNG TẬP TRUNG 3 PHẦN TRỌNG TÂM
    # =============================================================

    # -------------------------------------------------------------
    # PHẦN I: MỤC TIÊU CỦA ĐỀ TÀI (RÕ RÀNG, DỨT KHOÁT)
    # -------------------------------------------------------------
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
        "- Về Diễn đàn & Pass phòng (Điểm mới của đề tài): "
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

    # -------------------------------------------------------------
    # PHẦN II: TÍNH THỰC TIỄN CỦA ĐỀ TÀI
    # -------------------------------------------------------------
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

    # -------------------------------------------------------------
    # PHẦN III: SỰ HIỂU BIẾT VỀ VẤN ĐỀ NGHIÊN CỨU
    # -------------------------------------------------------------
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

    # =============================================================
    # CHỮ KÝ XÁC NHẬN GỌN GÀNG
    # =============================================================
    p_sign_sp = doc.add_paragraph()
    p_sign_sp.paragraph_format.space_before = Pt(20)
    p_sign_sp.paragraph_format.space_after = Pt(4)

    table_sign = doc.add_table(rows=3, cols=2)
    table_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_sign.autofit = False

    c_s0 = table_sign.rows[0].cells[0]
    c_s1 = table_sign.rows[0].cells[1]
    c_s0.width = Inches(3.2)
    c_s1.width = Inches(3.3)
    set_cell_white(c_s0)
    set_cell_white(c_s1)

    p_s0_head = c_s0.paragraphs[0]
    p_s0_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s0 = p_s0_head.add_run("XÁC NHẬN CỦA GIẢNG VIÊN HƯỚNG DẪN\n(Ký và ghi rõ họ tên)")
    r_s0.font.name = 'Times New Roman'
    r_s0.font.bold = True
    r_s0.font.size = Pt(11.5)
    r_s0.font.color.rgb = BLACK

    p_s1_head = c_s1.paragraphs[0]
    p_s1_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1 = p_s1_head.add_run("ĐẠI DIỆN NHÓM SINH VIÊN THỰC HIỆN\n(Ký và ghi rõ họ tên)")
    r_s1.font.name = 'Times New Roman'
    r_s1.font.bold = True
    r_s1.font.size = Pt(11.5)
    r_s1.font.color.rgb = BLACK

    # Khoảng trống ký tên
    table_sign.rows[1].cells[0].height = Inches(1.1)
    table_sign.rows[1].cells[1].height = Inches(1.1)
    set_cell_white(table_sign.rows[1].cells[0])
    set_cell_white(table_sign.rows[1].cells[1])

    # Tên người ký
    p_s0_foot = table_sign.rows[2].cells[0].paragraphs[0]
    p_s0_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s0_f = p_s0_foot.add_run("TS. LÊ VĂN VINH")
    r_s0_f.font.name = 'Times New Roman'
    r_s0_f.font.bold = True
    r_s0_f.font.size = Pt(12)
    r_s0_f.font.color.rgb = BLACK

    p_s1_foot = table_sign.rows[2].cells[1].paragraphs[0]
    p_s1_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1_f = p_s1_foot.add_run("Nguyễn Minh Quốc Khánh\n(Nhóm trưởng — Nhóm 04)")
    r_s1_f.font.name = 'Times New Roman'
    r_s1_f.font.bold = True
    r_s1_f.font.size = Pt(11.5)
    r_s1_f.font.color.rgb = BLACK

    # Lưu file Word
    out_path1 = r"d:\KLTN\Tro-Oi-code\Bao_Cao_Muc_Tieu_De_Tai_Nhom04_TroOi.docx"
    doc.save(out_path1)
    print(f"Saved: {out_path1}")

    out_path2 = r"d:\KLTN\Bao_Cao_Muc_Tieu_De_Tai_Nhom04_TroOi.docx"
    try:
        shutil.copyfile(out_path1, out_path2)
        print(f"Saved: {out_path2}")
    except PermissionError:
        print(f"Warning: {out_path2} is currently locked (likely open in Word).")

    # Copy vào thư mục artifact
    artifact_path = r"C:\Users\light\.gemini\antigravity\brain\c276acd3-54bb-4187-aaa8-cefb02574ef9\Bao_Cao_Muc_Tieu_De_Tai_Nhom04_TroOi.docx"
    try:
        shutil.copyfile(out_path1, artifact_path)
        print(f"Saved: {artifact_path}")
    except PermissionError:
        print(f"Warning: {artifact_path} is currently locked.")

if __name__ == '__main__':
    build_focused_document()
