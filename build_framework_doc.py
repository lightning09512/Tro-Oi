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

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
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

def build_doc():
    doc = docx.Document()

    # Căn lề chuẩn A4 luận văn HCMUTE: Trái 3.0cm, Trên 2.0cm, Dưới 2.0cm, Phải 2.0cm
    for section in doc.sections:
        section.top_margin = Inches(0.79)
        section.bottom_margin = Inches(0.79)
        section.left_margin = Inches(1.18)
        section.right_margin = Inches(0.79)
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)

    # Helper functions
    def add_p(text="", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=3, line_spacing=1.3, indent=0, hanging=0, bold=False, italic=False, size=13):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if indent:
            p.paragraph_format.first_line_indent = Pt(indent)
        if hanging:
            p.paragraph_format.left_indent = Pt(hanging)
            p.paragraph_format.first_line_indent = Pt(-hanging)
        if text:
            r = p.add_run(text)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(size)
            r.font.bold = bold
            r.font.italic = italic
            r.font.color.rgb = BLACK
        return p

    def add_dash_item(dash_label, content_text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.left_indent = Pt(20)
        p.paragraph_format.first_line_indent = Pt(-14)
        
        r_lbl = p.add_run(dash_label)
        r_lbl.font.name = 'Times New Roman'
        r_lbl.font.size = Pt(13)
        r_lbl.font.bold = True
        r_lbl.font.color.rgb = BLACK

        r_cnt = p.add_run(content_text)
        r_cnt.font.name = 'Times New Roman'
        r_cnt.font.size = Pt(13)
        r_cnt.font.color.rgb = BLACK
        return p

    def add_h1(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = BLACK
        return p

    def add_h2(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = BLACK
        return p

    # =============================================================
    # 1. TRANG BÌA CHUẨN CỦA BÀI BÁO CÁO NHÓM
    # =============================================================
    add_p("BỘ GIÁO DỤC VÀ ĐÀO TẠO", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=12, space_after=2)
    add_p("TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT TP. HỒ CHÍ MINH", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=13, space_after=2)
    add_p("KHOA ĐÀO TẠO CHẤT LƯỢNG CAO — NGÀNH CÔNG NGHỆ THÔNG TIN", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=12, space_after=2)
    add_p("---------******----------", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=12, space_after=14)

    # Logo
    logo_path = r"d:\KLTN\extracted_assets\word\media\image1.jpeg"
    if not os.path.exists(logo_path):
        logo_path = r"D:\KLTN\ch4_work\extracted_logos\word\media\image1.jpeg"
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(6)
        p_logo.paragraph_format.space_after = Pt(14)
        p_logo.add_run().add_picture(logo_path, width=Inches(1.8))

    add_p("TIỂU LUẬN CHUYÊN NGÀNH", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=14, space_before=8, space_after=6)
    add_p("XÂY DỰNG WEBSITE HỖ TRỢ TÌM KIẾM,\nCHIA SẺ VÀ CHUYỂN NHƯỢNG PHÒNG TRỌ", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=15, space_before=4, space_after=6, line_spacing=1.2)
    add_p("(NỀN TẢNG \"TRỌ ƠI\")", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=13, space_after=24)

    # Bảng thông tin SV & GVHD
    t_cover = doc.add_table(rows=6, cols=2)
    t_cover.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_cover.autofit = False

    cover_rows = [
        ("Giảng viên hướng dẫn:", "TS. LÊ VĂN VINH"),
        ("Đơn vị đào tạo:", "Khoa Đào tạo Chất lượng cao"),
        ("Thực hiện đề tài:", "Nhóm 04 (Lớp: CLC Tiếng Việt)"),
        ("Nguyễn Minh Quốc Khánh (Trưởng nhóm)", "MSSV: 23110113"),
        ("Phạm Minh Khánh", "MSSV: 23110114"),
        ("Hoàng Thanh Tú", "MSSV: 23110167"),
    ]

    for idx, (lbl, val) in enumerate(cover_rows):
        r = t_cover.rows[idx]
        c0, c1 = r.cells[0], r.cells[1]
        c0.width = Inches(2.7)
        c1.width = Inches(3.6)
        set_cell_white(c0)
        set_cell_white(c1)
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(2)
        p0.paragraph_format.space_after = Pt(2)
        r0 = p0.add_run(lbl)
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
        r1.font.bold = (idx in (0, 2))
        r1.font.color.rgb = BLACK

    add_p("Hồ Chí Minh, tháng 11 năm 2026", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=12, space_before=40)
    doc.add_page_break()

    # =============================================================
    # 2. TRANG MÔ TẢ ĐỀ TÀI (PHIẾU GIAO ĐỀ TÀI / NHIỆM VỤ ĐỀ TÀI)
    # =============================================================
    add_p("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=12, space_after=2)
    add_p("Độc lập – Tự do – Hạnh phúc", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=12, space_after=2)
    add_p("----------***----------", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=12, space_after=10)
    add_p("TP. Hồ Chí Minh, ngày 20 tháng 11 năm 2026", align=WD_ALIGN_PARAGRAPH.RIGHT, italic=True, size=12, space_after=14)

    add_p("MÔ TẢ ĐỀ TÀI", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=14, space_after=12)

    def add_line(bold_text, normal_text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.25
        rb = p.add_run(bold_text)
        rb.font.name = 'Times New Roman'
        rb.font.size = Pt(13)
        rb.font.bold = True
        rb.font.color.rgb = BLACK
        rn = p.add_run(normal_text)
        rn.font.name = 'Times New Roman'
        rn.font.size = Pt(13)
        rn.font.color.rgb = BLACK
        return p

    add_line("Họ và tên sinh viên thực hiện:\n", 
             "- Nguyễn Minh Quốc Khánh\tMSSV: 23110113\n"
             "- Phạm Minh Khánh\t\tMSSV: 23110114\n"
             "- Hoàng Thanh Tú\t\tMSSV: 23110167")
    add_line("Thời gian thực hiện: ", "Từ 07/09/2026 đến 20/11/2026")
    add_line("Ngành đào tạo: ", "Công nghệ thông tin (Khoa Đào tạo Chất lượng cao)")
    add_line("Tên đề tài: ", "Xây dựng website hỗ trợ tìm kiếm, chia sẻ và chuyển nhượng phòng trọ (Nền tảng \"Trọ Ơi\")")
    add_line("Giảng viên hướng dẫn: ", "TS. Lê Văn Vinh")
    
    add_p("Nhiệm vụ của đề tài: Xây dựng website hoàn chỉnh gồm các chức năng chính sau:", bold=True, space_before=8, space_after=4)

    add_p("Phía Khách vãng lai (chưa đăng nhập):", bold=True, space_before=4, space_after=2)
    add_dash_item("- ", "Tìm kiếm phòng trọ theo khu vực hoặc theo vị trí GPS; lọc theo giá thuê và diện tích.")
    add_dash_item("- ", "Xem chi tiết phòng (hình ảnh, mô tả, tiện ích, vị trí trên bản đồ OpenStreetMap).")
    add_dash_item("- ", "Đăng ký tài khoản, đăng nhập hệ thống, quên và khôi phục mật khẩu.")

    add_p("Phía Người thuê:", bold=True, space_before=4, space_after=2)
    add_dash_item("- ", "Kế thừa các chức năng của Khách vãng lai; quản lý hồ sơ cá nhân, đổi mật khẩu.")
    add_dash_item("- ", "Lưu tin phòng trọ yêu thích; đánh giá và bình luận phòng trọ (dành cho người đã/đang thuê).")
    add_dash_item("- ", "Đăng bài chia sẻ kinh nghiệm, đăng bài pass phòng (chuyển nhượng cọc/hợp đồng) và tìm người ở ghép trên diễn đàn cộng đồng.")
    add_dash_item("- ", "Thả cảm xúc và bình luận tương tác trên diễn đàn.")
    add_dash_item("- ", "Nhắn tin trực tiếp thời gian thực (real-time chat qua Socket.IO) với chủ trọ hoặc người pass phòng; báo cáo nội dung vi phạm.")

    add_p("Phía Chủ trọ:", bold=True, space_before=4, space_after=2)
    add_dash_item("- ", "Kế thừa các chức năng của Khách vãng lai.")
    add_dash_item("- ", "Đăng tin cho thuê phòng trọ; quản lý phòng trọ (chỉnh sửa, ẩn/hiện, đánh dấu đã cho thuê, xóa).")
    add_dash_item("- ", "Quản lý tin cho thuê; xem thống kê phòng (lượt xem, lượt liên hệ, tình trạng cho thuê).")
    add_dash_item("- ", "Đăng bài diễn đàn, nhắn tin trực tiếp với người thuê, báo cáo nội dung vi phạm.")

    add_p("Phía Quản trị viên (Admin):", bold=True, space_before=4, space_after=2)
    add_dash_item("- ", "Duyệt hoặc từ chối tin cho thuê phòng trọ mới đăng.")
    add_dash_item("- ", "Kiểm duyệt bài viết, bình luận trên diễn đàn; xử lý báo cáo vi phạm; gửi cảnh báo tới người dùng.")
    add_dash_item("- ", "Quản lý người dùng (khóa/mở khóa, xóa, phân quyền) và quản lý danh mục hệ thống (khu vực, loại phòng, tiện ích).")
    add_dash_item("- ", "Thống kê hiệu quả hoạt động hệ thống và xuất báo cáo dữ liệu (Excel/PDF).")

    doc.add_page_break()

    # =============================================================
    # 3. NHẬN XÉT CỦA GIẢNG VIÊN HƯỚNG DẪN
    # =============================================================
    add_p("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=12, space_after=2)
    add_p("Độc lập – Tự do – Hạnh phúc", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=12, space_after=2)
    add_p("----------***----------", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=12, space_after=10)
    add_p("TP. Hồ Chí Minh, ngày …… tháng …… năm 2026", align=WD_ALIGN_PARAGRAPH.RIGHT, italic=True, size=12, space_after=14)

    add_p("NHẬN XÉT CỦA GIẢNG VIÊN HƯỚNG DẪN", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=14, space_after=12)
    add_line("Họ và tên sinh viên 1: ", "Nguyễn Minh Quốc Khánh\tMSSV: 23110113")
    add_line("Họ và tên sinh viên 2: ", "Phạm Minh Khánh\t\tMSSV: 23110114")
    add_line("Họ và tên sinh viên 3: ", "Hoàng Thanh Tú\t\tMSSV: 23110167")
    add_line("Ngành đào tạo: ", "Công nghệ thông tin")
    add_line("Tên đề tài: ", "Xây dựng website hỗ trợ tìm kiếm, chia sẻ và chuyển nhượng phòng trọ")
    add_line("Giảng viên hướng dẫn: ", "TS. Lê Văn Vinh")

    add_p("NHẬN XÉT ĐÁNH GIÁ CỦA GIẢNG VIÊN:", bold=True, space_before=10, space_after=4)
    add_p("- Về nội dung đề tài và khối lượng thực hiện:", bold=True, space_before=4, space_after=2)
    add_p("……………………………………………………………………………………………………………………………………………………\n……………………………………………………………………………………………………………………………………………………")
    add_p("- Về tính thực tiễn và sự hiểu biết về vấn đề nghiên cứu:", bold=True, space_before=6, space_after=2)
    add_p("……………………………………………………………………………………………………………………………………………………\n……………………………………………………………………………………………………………………………………………………")
    add_p("- Ưu điểm:", bold=True, space_before=6, space_after=2)
    add_p("……………………………………………………………………………………………………………………………………………………\n……………………………………………………………………………………………………………………………………………………")
    add_p("- Khuyết điểm:", bold=True, space_before=6, space_after=2)
    add_p("……………………………………………………………………………………………………………………………………………………\n……………………………………………………………………………………………………………………………………………………")

    add_p("- Đề nghị cho bảo vệ hay không?  …………………………", space_before=6, space_after=2)
    add_p("- Đánh giá loại:  …………………………", space_before=2, space_after=2)
    add_p("- Điểm số:  …………………………", space_before=2, space_after=18)

    t_sign_gv = doc.add_table(rows=2, cols=2)
    t_sign_gv.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_sign_gv.autofit = False
    r0 = t_sign_gv.rows[0]; r1 = t_sign_gv.rows[1]
    set_cell_white(r0.cells[0]); set_cell_white(r0.cells[1])
    set_cell_white(r1.cells[0]); set_cell_white(r1.cells[1])
    r0.cells[0].width = Inches(3.2); r0.cells[1].width = Inches(3.2)
    r1.cells[0].width = Inches(3.2); r1.cells[1].width = Inches(3.2)
    
    p_s1 = r0.cells[1].paragraphs[0]
    p_s1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1 = p_s1.add_run("TP. Hồ Chí Minh, ngày …… tháng …… năm 2026\nGiảng viên hướng dẫn\n(Ký và ghi rõ họ tên)")
    r_s1.font.name = 'Times New Roman'; r_s1.font.size = Pt(12); r_s1.font.bold = True; r_s1.font.color.rgb = BLACK

    p_s1_b = r1.cells[1].paragraphs[0]
    p_s1_b.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_s1_b.paragraph_format.space_before = Pt(50)
    r_s1_b = p_s1_b.add_run("TS. LÊ VĂN VINH")
    r_s1_b.font.name = 'Times New Roman'; r_s1_b.font.size = Pt(13); r_s1_b.font.bold = True; r_s1_b.font.color.rgb = BLACK

    doc.add_page_break()

    # =============================================================
    # 4. PHẦN MỞ ĐẦU (ĐÚNG NGUYÊN VĂN KHUNG BÁO CÁO NHÓM)
    # =============================================================
    add_h1("PHẦN MỞ ĐẦU")

    add_h2("1. Tính cấp thiết của đề tài")
    add_p(
        "Tại các đô thị lớn như TP. Hồ Chí Minh và Hà Nội, phòng trọ là hình thức nhà ở chủ yếu của sinh viên và người lao động trẻ, "
        "kéo theo một thị trường tin đăng cho thuê có quy mô lớn. Riêng Phongtro123.com, một trong những kênh phổ biến nhất hiện nay, "
        "có hơn 70.000 tin đăng và khoảng 300.000 lượt truy cập mỗi tháng. Qua khảo sát bốn nền tảng tiêu biểu là Phongtro123.com, "
        "Chợ Tốt Nhà, Ohana và Mogi.vn, nhóm nhận thấy các hệ thống hiện có còn những hạn chế sau:",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=18
    )
    add_dash_item("- ", "Các nền tảng chủ yếu dừng ở việc đăng tin và tìm kiếm 1 chiều; người thuê chưa có công cụ để đánh giá phòng và chủ trọ dựa trên trải nghiệm thực tế của những người đã từng ở.")
    add_dash_item("- ", "Thiếu yếu tố cộng đồng: hầu như không có diễn đàn để người thuê và chủ trọ chia sẻ kinh nghiệm, trao đổi và hỏi đáp thông tin trực tiếp.")
    add_dash_item("- ", "Chưa có kênh hỗ trợ pass phòng và tìm người ở ghép: người thuê cần rời phòng trước thời hạn hợp đồng (thường ký 6–12 tháng) gặp rất nhiều khó khăn khi tìm người nhận lại phòng, dẫn đến nguy cơ mất trắng toàn bộ tiền đặt cọc (thường từ 2 đến 10 triệu đồng).")
    add_p(
        "Từ thực tế đó, việc xây dựng một hệ thống website kết hợp tìm kiếm phòng trọ, diễn đàn cộng đồng chia sẻ, pass phòng và mạng xã hội "
        "dành cho người thuê trọ là hết sức cấp thiết và mang tính ứng dụng thực tiễn cao.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=18, space_before=4
    )

    add_h2("2. Ý nghĩa khoa học và thực tiễn")
    add_p("Ý nghĩa khoa học:", bold=True, space_before=4, space_after=2)
    add_dash_item("- ", "Vận dụng bài bản kiến thức phân tích và thiết kế hệ thống hướng đối tượng (OOAD) bằng UML (Use Case, lược đồ lớp, lược đồ tuần tự) vào một bài toán thực tế quy mô lớn.")
    add_dash_item("- ", "Áp dụng kiến trúc Client – Server với chuẩn REST API; sử dụng mô hình cơ sở dữ liệu kết hợp: PostgreSQL + PostGIS quản lý dữ liệu quan hệ và tối ưu truy vấn không gian vị trí GPS cực nhanh; MongoDB lưu trữ hội thoại chat thời gian thực và thông báo; Socket.IO xử lý kết nối hai chiều tức thì.")
    add_dash_item("- ", "Làm tài liệu tham khảo chất lượng cho các đề tài nghiên cứu tương tự về hệ thống quản lý bất động sản kết hợp mạng xã hội chuyên ngành.")

    add_p("Ý nghĩa thực tiễn:", bold=True, space_before=4, space_after=2)
    add_dash_item("- ", "Giúp người thuê tìm phòng nhanh chóng nhờ tìm kiếm theo khu vực hành chính hoặc định vị GPS thực tế trong bán kính mong muốn (1km – 10km quanh trường học), lọc đa tiêu chí và xem vị trí trực quan trên bản đồ tương tác.")
    add_dash_item("- ", "Giúp chủ trọ đăng tin thuận tiện, quản lý phòng trống và theo dõi chính xác lượt xem, lượt liên hệ của khách thuê mà không qua môi giới trung gian.")
    add_dash_item("- ", "Tạo không gian diễn đàn chuyên biệt để người thuê dễ dàng chia sẻ kinh nghiệm, đăng bài pass phòng cứu tiền cọc và tìm người ở ghép tương thích lối sống khi có nhu cầu thay đổi chỗ ở.")
    add_dash_item("- ", "Xây dựng môi trường thuê trọ an toàn, minh bạch thông qua cơ chế người thuê thực tế đánh giá, cùng quy trình kiểm duyệt tin đăng và xử lý báo cáo vi phạm chặt chẽ của ban quản trị.")

    add_h2("3. Mục đích nghiên cứu (Mục tiêu chính của đề tài)")
    add_p("Đề tài hướng đến các mục đích nghiên cứu và mục tiêu cụ thể sau:", space_before=2, space_after=2)
    add_dash_item("- ", "Xây dựng hoàn chỉnh website cho phép chủ trọ đăng tin cho thuê và người thuê tìm kiếm, xem chi tiết, liên hệ trực tiếp phòng trọ.")
    add_dash_item("- ", "Tích hợp chuyên mục pass phòng (chuyển nhượng cọc/hợp đồng) và tìm bạn ở ghép giữa các người thuê thông qua diễn đàn cộng đồng.")
    add_dash_item("- ", "Tích hợp các tính năng mạng xã hội gồm diễn đàn thảo luận, đánh giá và bình luận phòng trọ, thả cảm xúc bài viết, nhắn tin trao đổi trực tiếp thời gian thực (real-time chat).")
    add_dash_item("- ", "Xây dựng phân hệ quản trị (Admin) hoàn chỉnh để duyệt tin phòng trọ, kiểm duyệt nội dung bài viết, xử lý báo cáo vi phạm, quản lý người dùng và xem thống kê số liệu trực quan.")
    add_dash_item("- ", "Thực hành trọn vẹn quy trình phát triển phần mềm chuyên nghiệp từ khảo sát, phân tích yêu cầu, thiết kế kiến trúc đến cài đặt mã nguồn và kiểm thử hệ thống.")

    add_h2("4. Đối tượng nghiên cứu")
    add_dash_item("- ", "Các nền tảng tìm phòng trọ hiện có tại Việt Nam (Phongtro123.com, Chợ Tốt Nhà, Ohana, Mogi.vn) và quy trình tìm kiếm, cho thuê, chuyển nhượng phòng trọ thực tế.")
    add_dash_item("- ", "Các nhóm người dùng tương tác trong hệ thống: Khách vãng lai, Người thuê trọ (sinh viên, người lao động), Chủ nhà trọ và Quản trị viên hệ thống.")
    add_dash_item("- ", "Bộ công nghệ phát triển ứng dụng hiện đại: ReactJS 19, TypeScript và Vite (Client); NodeJS và ExpressJS RESTful API (Server); PostgreSQL và PostGIS (Cơ sở dữ liệu quan hệ & GIS); MongoDB và Mongoose (Cơ sở dữ liệu NoSQL lưu tin nhắn/thông báo); Socket.IO (Giao tiếp thời gian thực); JWT và BCrypt (Xác thực & Bảo mật); Leaflet và OpenStreetMap (Bản đồ số).")

    add_h2("5. Phạm vi nghiên cứu")
    add_dash_item("- Về chức năng: ", "Hệ thống tập trung vào tìm kiếm và lọc phòng (theo khu vực/GPS, khoảng giá, diện tích); đăng tin và quản lý phòng cho thuê; diễn đàn cộng đồng (chia sẻ kinh nghiệm, đăng bài pass phòng và tìm ở ghép); đánh giá & bình luận phòng trọ; nhắn tin thời gian thực; báo cáo vi phạm; quản trị duyệt tin và thống kê báo cáo.")
    add_dash_item("- Về giới hạn: ", "Đề tài chưa triển khai cổng thanh toán trực tuyến hoặc đặt cọc giữ chỗ qua ngân hàng/ví điện tử, cũng như chưa tổ chức đội ngũ xác thực phòng trọ thực địa như nền tảng Ohana. Các chức năng mở rộng này được nhóm định hướng phát triển ở giai đoạn thương mại hóa tiếp theo.")
    add_dash_item("- Về nền tảng triển khai: ", "Hệ thống là ứng dụng web responsive chạy mượt mà trên mọi trình duyệt web hiện đại (Chrome, Edge, Safari), tương thích tối ưu trên cả máy tính để bàn (desktop) và thiết bị di động (mobile/tablet).")

    add_h2("6. Phương pháp nghiên cứu")
    add_dash_item("- Nghiên cứu tài liệu: ", "Tìm hiểu tài liệu chính thức của ReactJS, Vite, NodeJS/ExpressJS, PostgreSQL/PostGIS, MongoDB, Socket.IO, Leaflet và các báo cáo học thuật chuyên ngành liên quan.")
    add_dash_item("- Khảo sát thực tế: ", "Trải nghiệm và phân tích sâu chức năng, ưu điểm và nhược điểm của 4 nền tảng tìm phòng trọ phổ biến; lập bảng so sánh ma trận tính năng để xác định chính xác khoảng trống thị trường và điểm khác biệt của đề tài.")
    add_dash_item("- Phân tích và thiết kế hướng đối tượng: ", "Sử dụng công cụ mô hình hóa UML để xây dựng sơ đồ Use Case, lược đồ lớp, lược đồ tuần tự; thiết kế chuẩn hóa dữ liệu quan hệ trên PostgreSQL và dữ liệu phi quan hệ trên MongoDB.")
    add_dash_item("- Phương pháp thực nghiệm: ", "Cài đặt lập trình hoàn chỉnh toàn bộ mã nguồn hệ thống theo kiến trúc phân tầng (Controller – Service – Repository), sau đó tiến hành kiểm thử chức năng và phi chức năng.")
    add_dash_item("- Phương pháp làm việc nhóm: ", "Phân chia trách nhiệm rõ ràng theo Front-end, Back-end và Viết báo cáo; quản lý mã nguồn và tiến độ phiên bản thông qua Git và GitHub.")

    doc.add_page_break()

    # =============================================================
    # 5. KHẢO SÁT HIỆN TRẠNG & SO SÁNH CÁC HỆ THỐNG TƯƠNG TỰ
    # =============================================================
    add_h1("KHẢO SÁT HIỆN TRẠNG & SO SÁNH CÁC HỆ THỐNG TƯƠNG TỰ")
    add_p(
        "Nhóm đã tiến hành khảo sát thực tế 4 nền tảng tìm phòng trọ tiêu biểu tại Việt Nam gồm Phongtro123.com, Chợ Tốt Nhà, Ohana và Mogi.vn. "
        "Kết quả khảo sát khẳng định các nền tảng hiện nay chủ yếu hoạt động theo dạng sàn rao vặt 1 chiều, thiếu tính năng cộng đồng và "
        "hoàn toàn bỏ ngỏ nhu cầu chuyển nhượng (pass) phòng trọ của sinh viên. Bảng so sánh dưới đây tổng hợp chi tiết phạm vi tính năng của các nền tảng "
        "đối chiếu với hệ thống Trọ Ơi của nhóm:",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=18
    )

    # BẢNG SO SÁNH 2.1.6 CHUẨN CỦA BÁO CÁO
    t_comp = doc.add_table(rows=15, cols=6)
    t_comp.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_comp.autofit = False
    set_academic_grid_borders(t_comp)

    headers_comp = ["Nhóm chức năng", "Phongtro123", "Chợ Tốt Nhà", "Ohana", "Mogi.vn", "Hệ thống Trọ Ơi"]
    col_widths = [Inches(2.0), Inches(0.85), Inches(0.95), Inches(0.75), Inches(0.75), Inches(1.1)]

    # Header row
    for c_idx, title in enumerate(headers_comp):
        cell = t_comp.rows[0].cells[c_idx]
        cell.width = col_widths[c_idx]
        set_cell_white(cell)
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10.5)
        r.font.bold = True
        r.font.color.rgb = BLACK

    matrix_data = [
        ("Đăng ký, đăng nhập", "✓", "✓", "✓", "✓", "✓"),
        ("Tìm kiếm phòng theo khu vực/GPS", "✓", "✓", "✓", "✓", "✓"),
        ("Lọc theo giá, diện tích, tiện ích", "(✓)", "✓", "(✓)", "(✓)", "✓"),
        ("Xem chi tiết phòng (ảnh, bản đồ)", "✓", "✓", "✓", "✓", "✓"),
        ("Lưu tin yêu thích", "—", "(✓)", "(✓)", "(✓)", "✓"),
        ("Đăng tin & quản lý phòng cho thuê", "✓", "✓", "(✓)", "✓", "✓"),
        ("Xem thống kê phòng (chủ trọ)", "—", "(✓)", "—", "—", "✓"),
        ("Đăng bài chia sẻ & pass phòng", "—", "—", "—", "—", "✓ (Điểm mới)"),
        ("Nhắn tin trực tiếp real-time", "—", "(✓)", "(✓)*", "(✓)", "✓"),
        ("Đánh giá & bình luận phòng", "—", "—", "—", "—", "✓"),
        ("Diễn đàn chia sẻ kinh nghiệm", "—", "—", "—", "—", "✓"),
        ("Thả cảm xúc & bình luận bài viết", "—", "—", "—", "—", "✓"),
        ("Báo cáo vi phạm & kiểm duyệt", "—", "(✓)", "(✓)", "—", "✓"),
        ("Thống kê hệ thống (quản trị)", "—", "(✓)", "(✓)", "(✓)", "✓"),
    ]

    for r_idx, row_vals in enumerate(matrix_data):
        row = t_comp.rows[r_idx + 1]
        for c_idx, val in enumerate(row_vals):
            cell = row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_white(cell)
            set_cell_margins(cell, top=50, bottom=50, left=60, right=60)
            p = cell.paragraphs[0]
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                r = p.add_run(val)
                r.font.bold = (r_idx in (7, 8, 9, 10))
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                r = p.add_run(val)
                if "Điểm mới" in val:
                    r.font.bold = True
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
            r.font.color.rgb = BLACK

    p_note = add_p("Ghi chú: ✓: Có hỗ trợ; (✓): Hỗ trợ một phần; — : Không có hỗ trợ; (*): Ohana chỉ hỗ trợ chat với admin, không có chat người thuê – chủ trọ.", italic=True, size=10, space_before=4, space_after=10)

    # =============================================================
    # 6. KHUNG CẤU TRÚC ĐỀ TÀI & KẾ HOẠCH NỘI DUNG (ĐỀ CƯƠNG)
    # =============================================================
    add_h1("KHUNG CẤU TRÚC ĐỀ TÀI & TIẾN ĐỘ THỰC HIỆN")
    add_p("Toàn bộ nội dung đề tài được nhóm tổ chức thực hiện và trình bày theo khung 6 chương chuẩn quy cách HCMUTE:", space_before=2, space_after=4)

    chapters_summary = [
        ("Chương I: Cơ sở lý thuyết và công nghệ sử dụng", 
         "Nghiên cứu kiến trúc Client – Server và chuẩn REST API; thư viện ReactJS 19 và công cụ Vite; nền tảng NodeJS/ExpressJS; mô hình lưu trữ kết hợp PostgreSQL + PostGIS (tính toán khoảng cách GPS) và MongoDB (lưu trữ tin nhắn, thông báo); cơ chế xác thực JWT và mã hóa mật khẩu BCrypt; truyền nhận dữ liệu thời gian thực với Socket.IO; bản đồ số OpenStreetMap và Leaflet; dịch vụ quản lý ảnh Cloudinary."),
        ("Chương II: Khảo sát và phân tích yêu cầu", 
         "Khảo sát hiện trạng 4 nền tảng lớn; rút ra kết luận và lập bảng so sánh ma trận tính năng; phân tích chi tiết 4 tác nhân tương tác (Khách vãng lai, Người thuê, Chủ trọ, Quản trị viên); xác định đầy đủ 27 yêu cầu chức năng (FR01–FR27), 10 yêu cầu kỹ thuật (SFR01–SFR10) và 8 yêu cầu phi chức năng (NFR01–NFR08); xây dựng lược đồ và đặc tả chi tiết 56 Use Cases theo đúng chuẩn OOAD."),
        ("Chương III: Thiết kế phần mềm", 
         "Xây dựng lược đồ lớp tổng thể (Class Diagram) phân tầng Controller – Service – Repository; thiết kế cấu trúc cơ sở dữ liệu kết hợp tối ưu giữa PostgreSQL và MongoDB; xây dựng 34 lược đồ tuần tự (Sequence Diagram) mô tả chi tiết luồng xử lý dữ liệu cho cả phân hệ Người dùng và phân hệ Quản trị."),
        ("Chương IV: Đánh giá, cài đặt và thử nghiệm", 
         "Trình bày chi tiết giao diện thực tế của toàn bộ hệ thống (gồm 34 ảnh giao diện trích xuất trực tiếp từ mã nguồn Tro-Oi-code); hướng dẫn quy trình cài đặt, cấu hình biến môi trường và khởi chạy hệ thống cục bộ; xây dựng bộ kịch bản kiểm thử toàn diện gồm 46 tình huống kiểm thử chức năng (TC-01 đến TC-46) và các bài kiểm thử phi chức năng; đối chiếu kết quả thực hiện với mục tiêu ban đầu."),
        ("Chương V: Kết luận và hướng phát triển", 
         "Tổng kết các kết quả nổi bật đạt được của đề tài; phân tích trung thực những hạn chế hiện tại; đề xuất hướng phát triển mở rộng trong tương lai (tích hợp cổng thanh toán cọc trực tuyến, phát triển ứng dụng di động Flutter, triển khai hệ thống xác thực chủ nhà trọ thực địa)."),
        ("Chương VI: Tài liệu tham khảo", 
         "Tổng hợp danh mục 8 tài liệu kỹ thuật chính thức và các tiêu chuẩn học thuật được sử dụng trong suốt quá trình nghiên cứu và thực hiện đề tài.")
    ]

    for chap_title, chap_desc in chapters_summary:
        add_p(chap_title, bold=True, space_before=4, space_after=2)
        add_p(chap_desc, align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=18, space_before=0, space_after=4)

    # Chữ ký xác nhận của đại diện nhóm
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(14)
    p_sp.paragraph_format.space_after = Pt(4)

    t_sign_final = doc.add_table(rows=2, cols=2)
    t_sign_final.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_sign_final.autofit = False
    rf0 = t_sign_final.rows[0]; rf1 = t_sign_final.rows[1]
    set_cell_white(rf0.cells[0]); set_cell_white(rf0.cells[1])
    set_cell_white(rf1.cells[0]); set_cell_white(rf1.cells[1])
    rf0.cells[0].width = Inches(3.2); rf0.cells[1].width = Inches(3.2)
    rf1.cells[0].width = Inches(3.2); rf1.cells[1].width = Inches(3.2)

    p_f0 = rf0.cells[0].paragraphs[0]
    p_f0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_f0 = p_f0.add_run("XÁC NHẬN CỦA GVHD\n(Ký và ghi rõ họ tên)")
    r_f0.font.name = 'Times New Roman'; r_f0.font.size = Pt(12); r_f0.font.bold = True; r_f0.font.color.rgb = BLACK

    p_f1 = rf0.cells[1].paragraphs[0]
    p_f1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_f1 = p_f1.add_run("TP. Hồ Chí Minh, ngày 20 tháng 11 năm 2026\nĐẠI DIỆN NHÓM THỰC HIỆN\n(Ký và ghi rõ họ tên)")
    r_f1.font.name = 'Times New Roman'; r_f1.font.size = Pt(12); r_f1.font.bold = True; r_f1.font.color.rgb = BLACK

    p_f0_b = rf1.cells[0].paragraphs[0]
    p_f0_b.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_f0_b.paragraph_format.space_before = Pt(45)
    r_f0_b = p_f0_b.add_run("TS. LÊ VĂN VINH")
    r_f0_b.font.name = 'Times New Roman'; r_f0_b.font.size = Pt(13); r_f0_b.font.bold = True; r_f0_b.font.color.rgb = BLACK

    p_f1_b = rf1.cells[1].paragraphs[0]
    p_f1_b.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_f1_b.paragraph_format.space_before = Pt(45)
    r_f1_b = p_f1_b.add_run("Nguyễn Minh Quốc Khánh")
    r_f1_b.font.name = 'Times New Roman'; r_f1_b.font.size = Pt(13); r_f1_b.font.bold = True; r_f1_b.font.color.rgb = BLACK

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
    build_doc()
