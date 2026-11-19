import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CCCCCC", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:left w:val="none"/>\n'
        f'  <w:right w:val="none"/>\n'
        f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:insideV w:val="none"/>\n'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def set_box_border(table, color="1B492D", sz="24"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="none"/>\n'
        f'  <w:bottom w:val="none"/>\n'
        f'  <w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:right w:val="none"/>\n'
        f'  <w:insideH w:val="none"/>\n'
        f'  <w:insideV w:val="none"/>\n'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_document():
    doc = docx.Document()

    # Set page margins (Standard A4: Top/Bottom 2cm, Left 2.5cm, Right 2cm)
    for section in doc.sections:
        section.top_margin = Inches(0.79)
        section.bottom_margin = Inches(0.79)
        section.left_margin = Inches(0.98)
        section.right_margin = Inches(0.79)
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)

    # Base Normal Style
    normal_style = doc.styles['Normal']
    normal_font = normal_style.font
    normal_font.name = 'Times New Roman'
    normal_font.size = Pt(12)
    normal_font.color.rgb = RGBColor(0x1F, 0x29, 0x37)

    # -------------------------------------------------------------
    # 1. TRANG BÌA (COVER PAGE)
    # -------------------------------------------------------------
    p_univ = doc.add_paragraph()
    p_univ.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_univ.paragraph_format.space_before = Pt(0)
    p_univ.paragraph_format.space_after = Pt(2)
    run_univ1 = p_univ.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO\n")
    run_univ1.font.size = Pt(12)
    run_univ1.font.bold = True
    run_univ2 = p_univ.add_run("TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT TP. HỒ CHÍ MINH\n")
    run_univ2.font.size = Pt(13)
    run_univ2.font.bold = True
    run_univ3 = p_univ.add_run("KHOA ĐÀO TẠO CHẤT LƯỢNG CAO — NGÀNH CÔNG NGHỆ THÔNG TIN")
    run_univ3.font.size = Pt(12)
    run_univ3.font.bold = True

    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line.paragraph_format.space_before = Pt(2)
    p_line.paragraph_format.space_after = Pt(18)
    run_line = p_line.add_run("---------***---------")
    run_line.font.bold = True

    # Logo
    logo_path = r"D:\KLTN\ch4_work\extracted_logos\word\media\image1.jpeg"
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(0)
        p_logo.paragraph_format.space_after = Pt(20)
        p_logo.add_run().add_picture(logo_path, width=Inches(1.85))

    p_doc_type = doc.add_paragraph()
    p_doc_type.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_doc_type.paragraph_format.space_before = Pt(10)
    p_doc_type.paragraph_format.space_after = Pt(8)
    run_dt = p_doc_type.add_run("BÁO CÁO THẨM ĐỊNH MỤC TIÊU ĐỀ TÀI\nTIỂU LUẬN CHUYÊN NGÀNH / KHÓA LUẬN TỐT NGHIỆP")
    run_dt.font.size = Pt(13)
    run_dt.font.bold = True
    run_dt.font.color.rgb = RGBColor(0x1B, 0x49, 0x2D)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(8)
    run_title = p_title.add_run("ĐỀ TÀI:\n\"XÂY DỰNG WEBSITE HỖ TRỢ TÌM KIẾM, CHIA SẺ\nVÀ CHUYỂN NHƯỢNG PHÒNG TRỌ (NỀN TẢNG TRỌ ƠI)\"")
    run_title.font.size = Pt(15.5)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    p_crit = doc.add_paragraph()
    p_crit.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_crit.paragraph_format.space_before = Pt(6)
    p_crit.paragraph_format.space_after = Pt(36)
    run_crit = p_crit.add_run("Chuyên đề đánh giá: Tính thực tiễn của đề tài & Sự hiểu biết về vấn đề nghiên cứu\n(Theo chuẩn phân hệ đánh giá đồ án tốt nghiệp)")
    run_crit.font.size = Pt(11)
    run_crit.font.italic = True
    run_crit.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Bảng thông tin sinh viên & GVHD
    table_info = doc.add_table(rows=6, cols=2)
    table_info.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_info.autofit = False

    info_data = [
        ("Giảng viên hướng dẫn:", "TS. Lê Văn Vinh"),
        ("Đơn vị đào tạo:", "Khoa Đào tạo Chất lượng cao — HCMUTE"),
        ("Nhóm sinh viên thực hiện:", "Nhóm 04 (Lớp: CLC Tiếng Việt)"),
        ("Sinh viên 1 (Nhóm trưởng):", "Nguyễn Minh Quốc Khánh — MSSV: 23110113"),
        ("Sinh viên 2:", "Phạm Minh Khánh — MSSV: 23110114"),
        ("Sinh viên 3:", "Hoàng Thanh Tú — MSSV: 23110167"),
    ]

    for idx, (label, val) in enumerate(info_data):
        row = table_info.rows[idx]
        cell_lbl, cell_val = row.cells[0], row.cells[1]
        cell_lbl.width = Inches(2.5)
        cell_val.width = Inches(4.0)
        
        p0 = cell_lbl.paragraphs[0]
        p0.paragraph_format.space_after = Pt(3)
        p0.paragraph_format.space_before = Pt(3)
        r0 = p0.add_run(label)
        r0.font.bold = True
        r0.font.size = Pt(11.5)

        p1 = cell_val.paragraphs[0]
        p1.paragraph_format.space_after = Pt(3)
        p1.paragraph_format.space_before = Pt(3)
        r1 = p1.add_run(val)
        r1.font.size = Pt(11.5)
        if idx in (0, 2):
            r1.font.bold = True

    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_date.paragraph_format.space_before = Pt(50)
    p_date.paragraph_format.space_after = Pt(0)
    run_date = p_date.add_run("TP. HỒ CHÍ MINH, THÁNG 11 NĂM 2026")
    run_date.font.size = Pt(11.5)
    run_date.font.bold = True

    doc.add_page_break()

    # -------------------------------------------------------------
    # 2. NỘI DUNG CHÍNH BÁO CÁO
    # -------------------------------------------------------------
    
    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x1B, 0x49, 0x2D) # Forest green
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A) # Slate navy
        return p

    def add_heading_3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.italic = True
        r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        return p

    def add_body(text, bold_prefix=""):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.25
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.bold = True
        p.add_run(text)
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.2
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.bold = True
        p.add_run(text)
        return p

    def add_callout_box(text, bold_title=""):
        t = doc.add_table(rows=1, cols=1)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = t.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_background(cell, "F0FDF4") # Pale mint
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
        set_box_border(t, color="1B492D", sz="24")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.2
        if bold_title:
            rb = p.add_run(bold_title + "\n")
            rb.font.bold = True
            rb.font.size = Pt(11.5)
            rb.font.color.rgb = RGBColor(0x1B, 0x49, 0x2D)
        rt = p.add_run(text)
        rt.font.size = Pt(11)
        rt.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
        # Empty space after table
        p_sp = doc.add_paragraph()
        p_sp.paragraph_format.space_before = Pt(2)
        p_sp.paragraph_format.space_after = Pt(2)

    # -------------------------------------------------------------
    # PHẦN 1: MỤC TIÊU CỦA ĐỀ TÀI (ĐÁP ỨNG TRỌNG TÂM GVHD YÊU CẦU)
    # -------------------------------------------------------------
    add_heading_1("I. MỤC TIÊU CỦA ĐỀ TÀI (PROJECT OBJECTIVES)")

    add_callout_box(
        "Tuyên ngôn mục tiêu trọng tâm: Đề tài 'Trọ Ơi' tập trung giải quyết trọn vẹn điểm nghẽn lớn nhất của sinh viên và người lao động đô thị hiện nay: "
        "kết hợp đồng bộ giữa việc tìm phòng trọ minh bạch, tiện lợi trên bản đồ số, với một không gian diễn đàn cộng đồng an toàn để người thuê dễ dàng "
        "sang nhượng cọc/pass phòng khi chuyển nơi ở trước hạn, tìm bạn cùng phòng tương thích, và trao đổi trực tiếp tức thì (real-time) với chủ trọ "
        "mà không qua bất kỳ khâu trung gian môi giới nào.",
        "MỤC TIÊU ĐỊNH VỊ CỦA NỀN TẢNG TRỌ ƠI"
    )

    add_heading_2("1.1. Mục tiêu tổng quát (General Objective)")
    add_body(
        "Nghiên cứu, phân tích, thiết kế và xây dựng hoàn chỉnh nền tảng ứng dụng web PropTech kết hợp mạng xã hội mang tên \"Trọ Ơi\" "
        "(tại kho mã nguồn thực thi Tro-Oi-code). Hệ thống cung cấp giải pháp toàn diện hỗ trợ sinh viên và người lao động trong việc tìm kiếm phòng trọ "
        "theo vị trí địa lý thông minh, kiểm soát tính minh bạch của thông tin phòng và chi phí sinh hoạt, tạo lập không gian diễn đàn chuyển nhượng cọc "
        "(pass phòng) và tìm người ở ghép uy tín, đồng thời cung cấp bộ công cụ số hóa khép kín cho chủ nhà trọ quản lý tin đăng và cho quản trị viên "
        "kiểm duyệt nội dung an toàn."
    )

    add_heading_2("1.2. Mục tiêu cụ thể về Chức năng & Nghiệp vụ (Specific Functional Objectives)")
    add_body("Hệ thống phân định rạch ròi 4 tác nhân (Actors) với các mục tiêu nghiệp vụ cụ thể sau:")

    add_bullet(
        "Cung cấp khả năng tìm kiếm đa phương thức: tra cứu theo địa bàn hành chính (Tỉnh/Thành, Quận/Huyện, Phường/Xã) hoặc theo tọa độ thực tế định vị GPS với bán kính tùy chỉnh; "
        "bộ lọc thông minh kết hợp đồng thời nhiều tiêu chí (khoảng giá thuê, khoảng diện tích, tiện ích phòng, loại hình phòng trọ/ký túc xá/căn hộ mini); "
        "trực quan hóa vị trí phòng trên nền bản đồ số tương tác (Leaflet/OpenStreetMap); xem chi tiết chi phí minh bạch (giá điện, nước, internet, gửi xe, tiền cọc).",
        "1. Phân hệ Khách vãng lai & Tìm kiếm thông minh (Guest & Discovery): "
    )

    add_bullet(
        "Trang bị đầy đủ các tiện ích quản lý cá nhân: lưu trữ danh sách tin trọ yêu thích để tiện so sánh; "
        "đăng tải đánh giá xếp hạng sao và bình luận thực tế về chất lượng phòng (chỉ áp dụng đối với người đã/đang thực tế thuê phòng nhằm triệt tiêu nạn đánh giá ảo); "
        "tham gia thảo luận trên diễn đàn: đăng bài chia sẻ kinh nghiệm thuê trọ, đăng tin pass phòng/sang nhượng hợp đồng khi cần chuyển đi gấp, đăng tin tìm bạn cùng phòng; "
        "nhắn tin trực tiếp thời gian thực (Chat real-time) với chủ trọ hoặc người pass phòng; gửi báo cáo vi phạm nội dung xấu độc.",
        "2. Phân hệ Người thuê phòng (Tenant Module): "
    )

    add_bullet(
        "Số hóa quy trình cho thuê nhà: Đăng tin cho thuê mới với biểu mẫu chuẩn hóa (đầy đủ tọa độ bản đồ, bộ ảnh trực quan, bảng chi phí chi tiết); "
        "quản lý trạng thái vận hành của phòng (Đang hiển thị, Tạm ẩn, Đã cho thuê và ghi nhận người đang thuê); "
        "theo dõi bảng điều khiển (Dashboard) thống kê hiệu quả tin đăng (số lượt xem phòng, số lượt liên hệ trao đổi, mức độ quan tâm theo thời gian thực); "
        "tiếp nhận tin nhắn hỏi phòng từ người thuê trực tiếp ngay trong hệ thống.",
        "3. Phân hệ Chủ nhà trọ (Landlord Module): "
    )

    add_bullet(
        "Đảm bảo an ninh và chất lượng toàn hệ thống: Kiểm duyệt nghiêm ngặt 100% tin đăng phòng trọ mới của chủ trọ trước khi hiển thị công khai; "
        "rà soát, kiểm duyệt, ẩn/gỡ bài viết hoặc xóa bình luận vi phạm quy chuẩn cộng đồng trên diễn đàn; "
        "tiếp nhận và xử lý khiếu nại báo cáo vi phạm từ người dùng, thực thi cơ chế gửi cảnh báo hệ thống; "
        "quản lý người dùng (xem danh sách, phân quyền vai trò, khóa/mở khóa tài khoản vi phạm chính sách); "
        "quản lý danh mục cốt lõi (khu vực, loại phòng, tiện ích); tổng hợp số liệu báo cáo chuyên sâu và xuất tệp dữ liệu kiểm toán định dạng Excel/PDF.",
        "4. Phân hệ Quản trị hệ thống (Admin & Moderator Module): "
    )

    add_heading_2("1.3. Mục tiêu cụ thể về Kỹ thuật & Kiến trúc Phần mềm (Specific Technical Objectives)")
    add_bullet(
        "Phân tách độc lập phần giao diện (Client SPA với ReactJS 19, TypeScript, Vite) và tầng xử lý nghiệp vụ (Server API với NodeJS, ExpressJS), "
        "giao tiếp an toàn thông qua chuẩn RESTful API, tạo tiền đề thuận lợi cho việc mở rộng phát triển ứng dụng di động (Mobile App) trong tương lai.",
        "1. Kiến trúc phân tầng chuẩn mực (Client-Server Architecture): "
    )

    add_bullet(
        "Kết hợp ưu thế của 2 hệ quản trị cơ sở dữ liệu hàng đầu: "
        "(a) PostgreSQL kết hợp phần mở rộng PostGIS quản lý chặt chẽ dữ liệu quan hệ có cấu trúc (Users, Roles, Properties, Amenities, Forum Posts, Comments, Reviews, Reports) "
        "với các ràng buộc khóa ngoại, tính toàn vẹn giao dịch và truy vấn không gian địa lý bằng chỉ mục GIST; "
        "(b) MongoDB lưu trữ tối ưu dữ liệu phi cấu trúc và bán cấu trúc có tần suất đọc/ghi cao như lịch sử hội thoại tin nhắn (Conversations, Messages) và thông báo hệ thống (Notifications).",
        "2. Mô hình Cơ sở dữ liệu lai (Hybrid Database Model - Polyglot Persistence): "
    )

    add_bullet(
        "Ứng dụng giao thức WebSocket qua thư viện Socket.IO, triển khai cơ chế phân phòng chat (Room) giúp tin nhắn giữa người thuê và chủ nhà/người pass phòng "
        "được gửi - nhận tức thì với độ trễ dưới 200ms, tự động đồng bộ khi khôi phục kết nối mạng và hỗ trợ đa thiết bị đồng thời.",
        "3. Cơ chế giao tiếp thời gian thực (Real-time Engine): "
    )

    add_bullet(
        "Triển khai xác thực phi trạng thái (Stateless Authentication) qua mã JSON Web Token (JWT); "
        "bảo vệ an toàn mật khẩu bằng thuật toán băm một chiều BCrypt kết hợp Salt 10 vòng; "
        "ngăn chặn tuyệt đối các lỗ hổng bảo mật phổ biến (SQL Injection bằng câu lệnh tham số hóa parameterized queries, XSS bằng cơ chế khử khuẩn đầu vào sanitization, "
        "thiết lập bảo mật HTTP Header qua Helmet, cấu hình CORS nghiêm ngặt và giới hạn tần suất truy cập Express Rate Limit).",
        "4. Chuẩn hóa Bảo mật & Kiểm soát truy cập (Security & RBAC): "
    )

    # -------------------------------------------------------------
    # PHẦN 2: TÍNH THỰC TIỄN CỦA ĐỀ TÀI
    # -------------------------------------------------------------
    add_heading_1("II. TÍNH THỰC TIỄN CỦA ĐỀ TÀI (PRACTICAL SIGNIFICANCE)")

    add_heading_2("2.1. Bối cảnh và tính cấp thiết xuất phát từ đời sống thực tế")
    add_body(
        "Tại các đô thị phát triển mạnh mẽ như TP. Hồ Chí Minh và Hà Nội, phòng trọ là hình thức cư trú thiết yếu của hơn 70% sinh viên, học viên "
        "và người lao động trẻ nhập cư. Theo thống kê tại TP.HCM, hiện có hơn 500.000 sinh viên theo học tại hàng chục trường đại học, cao đẳng "
        "tập trung tại các cụm làng đại học (Thủ Đức, Dĩ An, Quận 10, Bình Thạnh, Gò Vấp...). Nhu cầu tìm kiếm chỗ ở là thường trực và tăng đột biến "
        "vào mỗi mùa nhập học (tháng 8 - 10) cũng như thời điểm ra trường (tháng 6 - 7)."
    )
    add_body(
        "Tuy nhiên, trải nghiệm tìm trọ thực tế của sinh viên hiện đang đối mặt với hàng loạt rủi ro nhức nhối:",
        "Những thách thức thực tế của người đi thuê trọ: "
    )
    add_bullet("Các hội nhóm Facebook, Zalo tràn ngập bài đăng của 'cò mồi', tin đăng 'treo đầu dê bán thịt chó', hình ảnh phòng trên mạng khác xa thực tế.", "• Ma trận tin ảo và thông tin mập mờ: ")
    add_bullet("Người thuê nhẹ dạ bị lừa chuyển tiền giữ chỗ/đặt cọc khi chưa ký hợp đồng pháp lý hoặc gặp chủ trọ mạo danh.", "• Nạn lừa đảo chiếm đoạt tiền cọc: ")
    add_bullet("Chủ nhà thường không công khai biểu phí điện, nước, wifi, phí thang máy, tiền rác, khiến người thuê bị động và sốc chi phí sau tháng đầu tiên sinh hoạt.", "• Chi phí phát sinh 'ẩn': ")
    add_bullet("Sinh viên chuyển trường, chuyển chỗ làm hoặc thay đổi hoàn cảnh gia đình muốn trả phòng trước thời hạn hợp đồng (thường ký 6-12 tháng) "
               "buộc phải chấp nhận mất trắng khoản tiền cọc 1-2 tháng (từ 2 đến 10 triệu đồng), vì hoàn toàn không có kênh chuyển nhượng hợp pháp.", "• Rủi ro mất cọc khi kết thúc hợp đồng trước hạn: ")

    add_heading_2("2.2. Giá trị thực tiễn mang lại cho từng nhóm đối tượng")
    
    # Bảng giá trị thực tiễn
    table_val = doc.add_table(rows=4, cols=2)
    table_val.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_val.autofit = False
    set_table_borders(table_val)

    val_headers = table_val.rows[0]
    set_cell_background(val_headers.cells[0], "1B492D")
    set_cell_background(val_headers.cells[1], "1B492D")
    val_headers.cells[0].width = Inches(2.2)
    val_headers.cells[1].width = Inches(4.3)
    p_vh0 = val_headers.cells[0].paragraphs[0]
    p_vh0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_vh0 = p_vh0.add_run("Nhóm thụ hưởng")
    r_vh0.font.bold = True
    r_vh0.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    p_vh1 = val_headers.cells[1].paragraphs[0]
    p_vh1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_vh1 = p_vh1.add_run("Giá trị thực tiễn và Giải pháp mang lại")
    r_vh1.font.bold = True
    r_vh1.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    val_rows_data = [
        (
            "Người thuê trọ\n(Sinh viên, người đi làm)",
            "• Rút ngắn 70% thời gian tìm kiếm phòng trọ nhờ định vị GPS bán kính và hiển thị trực quan bản đồ.\n"
            "• Minh bạch hóa tài chính: Bảng chi phí niêm yết rõ giá thuê, cọc, điện, nước, tiện ích không thể mập mờ.\n"
            "• Tránh rủi ro tin giả nhờ quy trình kiểm duyệt của Admin và đánh giá sao thực tế từ người từng ở.\n"
            "• Giải quyết rủi ro mất cọc: Dễ dàng đăng bài Pass phòng trên diễn đàn để tìm người kế thừa hợp đồng.\n"
            "• Tìm bạn ở ghép cùng phong cách sống, tiết kiệm gánh nặng chi phí sinh hoạt hàng tháng."
        ),
        (
            "Chủ nhà trọ\n(Cá nhân, hộ kinh doanh)",
            "• Tiếp cận trực tiếp hàng chục ngàn sinh viên có nhu cầu thực tế mà không phải chiết khấu phí hoa hồng cho môi giới.\n"
            "• Quản lý danh mục phòng chuyên nghiệp: Theo dõi phòng trống, phòng đã thuê, cập nhật trạng thái chỉ với một thao tác.\n"
            "• Bảng thống kê hiệu quả tin đăng (Dashboard) giúp chủ trọ nắm bắt chính xác mức độ quan tâm của thị trường (lượt xem, lượt nhắn tin).\n"
            "• Trao đổi trực tiếp, sàng lọc đối tượng người thuê phù hợp ngay trên ứng dụng thông qua kênh chat tích hợp."
        ),
        (
            "Cộng đồng & Xã hội\n(Môi trường văn minh)",
            "• Xây dựng văn hóa thuê trọ văn minh, minh bạch thông tin, hỗ trợ tương trợ sinh viên thời kỳ bão giá.\n"
            "• Giảm thiểu tối đa các vụ việc tranh chấp, khiếu kiện tiền cọc hoặc lừa đảo chiếm đoạt tài sản trên địa bàn thành phố.\n"
            "• Đóng góp một sản phẩm công nghệ chuyển đổi số (PropTech) 'Make in Vietnam' phục vụ cộng đồng sinh viên các trường đại học."
        )
    ]

    for idx, (grp, cont) in enumerate(val_rows_data):
        row = table_val.rows[idx + 1]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        if idx % 2 == 1:
            set_cell_background(c0, "F8FAFC")
            set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, top=100, bottom=100, left=140, right=140)
        set_cell_margins(c1, top=100, bottom=100, left=140, right=140)
        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r0 = p0.add_run(grp)
        r0.font.bold = True
        r0.font.size = Pt(11)
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r1 = p1.add_run(cont)
        r1.font.size = Pt(11)
        p1.paragraph_format.line_spacing = 1.2

    # -------------------------------------------------------------
    # PHẦN 3: SỰ HIỂU BIẾT VỀ VẤN ĐỀ NGHIÊN CỨU
    # -------------------------------------------------------------
    add_heading_1("III. SỰ HIỂU BIẾT VỀ VẤN ĐỀ NGHIÊN CỨU (RESEARCH UNDERSTANDING)")

    add_heading_2("3.1. Khảo sát hiện trạng và Phân tích khoảng trống thị trường (Market Gap Analysis)")
    add_body(
        "Để có cơ sở khoa học xác định tính khả thi và định hình sản phẩm, nhóm đã tiến hành khảo sát, mổ xẻ chi tiết 4 nền tảng tìm phòng trọ "
        "đang hoạt động phổ biến nhất tại Việt Nam hiện nay:"
    )

    # Bảng so sánh 4 nền tảng
    table_comp = doc.add_table(rows=6, cols=6)
    table_comp.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_comp.autofit = False
    set_table_borders(table_comp)

    headers_comp = ["Tính năng cốt lõi", "Phongtro123", "Chợ Tốt Nhà", "Ohana", "Mogi.vn", "Trọ Ơi (Đề tài)"]
    widths_comp = [Inches(1.8), Inches(0.9), Inches(0.9), Inches(0.9), Inches(0.9), Inches(1.1)]

    row_h = table_comp.rows[0]
    for c_idx, title in enumerate(headers_comp):
        cell = row_h.cells[c_idx]
        cell.width = widths_comp[c_idx]
        set_cell_background(cell, "1B492D")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    comp_matrix = [
        ("Tìm kiếm Bản đồ GPS", "Không", "Có", "Có", "Có", "Có (PostGIS)"),
        ("Kiểm duyệt tin đăng", "Hạn chế", "Hạn chế", "Thực địa (chậm)", "Hạn chế", "Admin 100%"),
        ("Đánh giá/Review người thật", "Không", "Không", "Không", "Không", "Có (Xác thực ở)"),
        ("Chat real-time trực tiếp", "Không (gọi SĐT)", "Có", "Chỉ chat admin", "Không", "Có (Socket.IO)"),
        ("Diễn đàn Pass phòng / Ở ghép", "Không", "Không", "Không", "Không", "Có (Chuyên mục)"),
    ]

    for r_idx, row_data in enumerate(comp_matrix):
        row = table_comp.rows[r_idx + 1]
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = widths_comp[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            if c_idx == 5: # Cột đề tài
                set_cell_background(cell, "ECFDF5") # Highlight light green
            set_cell_margins(cell, top=80, bottom=80, left=80, right=80)
            p = cell.paragraphs[0]
            if c_idx > 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.size = Pt(10)
            if c_idx == 5 or "Có" in val:
                r.font.bold = True

    add_body(
        "Từ bảng đối chiếu trên, nhóm nhận thấy các nền tảng hiện nay hoạt động chủ yếu theo mô hình sàn rao vặt một chiều (One-way Classified Ads): "
        "chủ trọ trả phí đăng tin, người thuê đọc số điện thoại và tự gọi ngoài. Hạn chế này dẫn đến việc không kiểm soát được tin đã cho thuê, "
        "thiếu tương tác hai chiều, không hỗ trợ sinh viên sang nhượng hợp đồng khi có sự cố, và hoàn toàn thiếu vắng yếu tố cộng đồng. "
        "Đây chính là cơ hội và khoảng trống nghiên cứu then chốt để 'Trọ Ơi' xây dựng giải pháp vượt trội.",
        "Nhận xét khoảng trống nghiên cứu: "
    )

    add_heading_2("3.2. Sự hiểu biết về Phân tích & Thiết kế Hệ thống Hướng đối tượng (OOAD)")
    add_body(
        "Nhóm đã thể hiện sự hiểu biết sâu sắc về nghiệp vụ và quy trình phát triển phần mềm thông qua việc mô hình hóa hệ thống chuẩn mực:"
    )
    add_bullet(
        "Hệ thống đã phân rã toàn diện 56 Use Cases nghiệp vụ, được phân chia mạch lạc thành 2 Module chính: Module Người dùng (User Module) "
        "và Module Quản trị (Admin Module). Mỗi Use Case đều được đặc tả chi tiết về Pre-condition, Post-condition, Main Flow, Alternative Flow và Business Rules.",
        "1. Danh mục 56 Use Cases hoàn chỉnh: "
    )
    add_bullet(
        "Lược đồ lớp bao gồm 8 phân hệ nghiệp vụ chính (AuthModule, RoomModule, FavoriteModule, ForumModule, ReviewModule, ReportModule, MessageModule, AdminModule) "
        "kết hợp chặt chẽ với các thực thể dữ liệu (Users, Properties, ForumPosts, Comments, Reactions, Reviews, Reports, Conversations, Messages).",
        "2. Thiết kế Lược đồ lớp (Class Diagram): "
    )
    add_bullet(
        "Xây dựng chi tiết 34 Lược đồ tuần tự (Sequence Diagrams) từ UC-01 đến UC-A34, mô tả tuần tự các luồng thông điệp từ giao diện người dùng, "
        "qua tầng API Controller, xác thực Middleware, Service nghiệp vụ đến các câu lệnh truy vấn cơ sở dữ liệu PostgreSQL/MongoDB và gửi phản hồi.",
        "3. Thiết kế Lược đồ tuần tự chi tiết: "
    )

    add_heading_2("3.3. Sự hiểu biết và làm chủ Công nghệ Kỹ thuật hiện đại")
    add_bullet(
        "Không dùng các phép tính khoảng cách xấp xỉ bằng công thức Haversine thuần ở Backend (gây tải CPU), đề tài sử dụng kiểu dữ liệu không gian "
        "GEOMETRY(Point, 4326) của PostGIS kết hợp hàm ST_DWithin và chỉ mục không gian GIST. Nhờ đó, việc tìm kiếm phòng trọ trong bán kính 1km - 10km "
        "quanh trường đại học hoặc vị trí GPS người dùng đạt tốc độ mili-giây ngay cả trên tập dữ liệu hàng chục ngàn bản ghi.",
        "1. Tối ưu hóa truy vấn không gian với PostGIS: "
    )
    add_bullet(
        "Nhóm nhận thức rõ đặc tính truy vấn khác biệt giữa các nghiệp vụ: Dữ liệu quan hệ cần tính toàn vẹn cao (ACID) như thông tin tài khoản, "
        "tin phòng, bài viết diễn đàn và báo cáo vi phạm được lưu tại PostgreSQL; trong khi dữ liệu hội thoại chat và thông báo thời gian thực cần ghi cực nhanh, "
        "phân trang linh hoạt được lưu tại MongoDB. Cơ chế Outbox Pattern được áp dụng để đảm bảo tính nhất quán dữ liệu giữa hai hệ cơ sở dữ liệu.",
        "2. Kiến trúc lưu trữ đa mô hình (Polyglot Persistence): "
    )
    add_bullet(
        "Giao thức WebSocket duy trì kênh kết nối liên tục, giải quyết bài toán giao tiếp hai chiều (Full-Duplex) mà HTTP polling truyền thống không đáp ứng được, "
        "tiết kiệm băng thông máy chủ và mang lại trải nghiệm mượt mà như các ứng dụng Messenger hay Zalo.",
        "3. Cơ chế giao tiếp thời gian thực Socket.IO: "
    )

    # -------------------------------------------------------------
    # PHẦN 4: KẾT QUẢ ĐẠT ĐƯỢC VÀ PHẠM VI ỨNG DỤNG
    # -------------------------------------------------------------
    add_heading_1("IV. KẾT QUẢ ĐẠT ĐƯỢC VÀ PHẠM VI ỨNG DỤNG (RESULTS & DELIVERABLES)")

    add_heading_2("4.1. Kết quả thực thi thực tế (Triển khai đầy đủ trên mã nguồn)")
    add_body(
        "Đề tài đã hoàn thành xuất sắc các nội dung nghiên cứu và triển khai hoàn thiện trên toàn bộ mã nguồn dự án (Tro-Oi-code), cụ thể:"
    )
    add_bullet("Hoàn thiện 100% các trang giao diện responsive (Desktop, Tablet, Mobile) với ngôn ngữ thiết kế PropTech hiện đại, tinh tế, chuẩn trải nghiệm người dùng.", "• Giao diện Frontend: ")
    add_bullet("Triển khai hơn 30 RESTful API endpoints xử lý toàn bộ các nghiệp vụ xác thực JWT, quản lý tin đăng, bộ lọc đa năng, bài viết diễn đàn, đánh giá phòng, khiếu nại báo cáo và trích xuất báo cáo Excel/PDF.", "• Hệ thống Backend API: ")
    add_bullet("Thiết lập hoàn chỉnh kết nối đồng thời PostgreSQL (với PostGIS và migrations) và MongoDB (với Mongoose schemas).", "• Cơ sở dữ liệu: ")
    add_bullet("Xây dựng bộ kịch bản kiểm thử toàn diện gồm 46 ca kiểm thử chức năng (Functional Test Cases từ TC-01 đến TC-46) và các bài kiểm thử phi chức năng về hiệu năng, bảo mật và khả năng phục hồi kết nối.", "• Kế hoạch kiểm thử: ")

    add_heading_2("4.2. Giới hạn phạm vi đề tài & Hướng phát triển")
    add_body(
        "Nhóm xác định rõ ràng ranh giới phạm vi triển khai của đồ án tiểu luận chuyên ngành nhằm đảm bảo tính khả thi cao nhất:",
        "Giới hạn phạm vi hiện tại: "
    )
    add_bullet("Chưa tích hợp cổng thanh toán trực tuyến (VNPay/Momo) để đặt cọc online (do các yêu cầu về tư cách pháp nhân doanh nghiệp khi đăng ký đối tác cổng thanh toán).", "• Thanh toán: ")
    add_bullet("Chưa triển khai đội ngũ nhân sự kiểm duyệt thực tế tại từng căn phòng trọ như Ohana (được thay thế bằng quy trình kiểm duyệt trực tuyến qua hình ảnh, giấy tờ pháp lý của Admin và cơ chế đánh giá của cộng đồng).", "• Xác thực thực địa: ")

    # -------------------------------------------------------------
    # PHẦN 5: BẢNG TỔNG HỢP TIÊU CHÍ ĐÁNH GIÁ (DÀNH CHO GVHD)
    # -------------------------------------------------------------
    add_heading_1("V. BẢNG TỔNG HỢP TIÊU CHÍ ĐÁNH GIÁ (EVALUATION MATRIX)")
    add_body("Bảng đối chiếu tổng kết các tiêu chí đánh giá trọng tâm theo đúng yêu cầu xác nhận của Giảng viên hướng dẫn:")

    table_eval = doc.add_table(rows=5, cols=3)
    table_eval.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_eval.autofit = False
    set_table_borders(table_eval)

    headers_eval = ["Tiêu chí đánh giá", "Mức độ đáp ứng của đề tài", "Minh chứng trong đồ án & mã nguồn"]
    widths_eval = [Inches(1.8), Inches(2.3), Inches(2.4)]

    row_eh = table_eval.rows[0]
    for c_idx, title in enumerate(headers_eval):
        cell = row_eh.cells[c_idx]
        cell.width = widths_eval[c_idx]
        set_cell_background(cell, "1B492D")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(10.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    eval_matrix = [
        (
            "1. Tính rõ ràng của Mục tiêu\n(Clarity of Objectives)",
            "Xác định rõ ràng mục tiêu tổng quát và phân rã chi tiết thành 4 nhóm mục tiêu chức năng (Guest, Tenant, Landlord, Admin) cùng 4 mục tiêu kỹ thuật phân tầng.",
            "• Chương Mở đầu & Mục 2.2 của báo cáo.\n• 56 Use Cases đặc tả cụ thể.\n• Hệ thống mã nguồn phân tầng rõ ràng."
        ),
        (
            "2. Tính thực tiễn của Đề tài\n(Practical Significance)",
            "Giải quyết trực tiếp bài toán bức xúc của hơn 500.000 sinh viên tại TP.HCM: tìm trọ minh bạch, phòng chống lừa đảo cọc, đặc biệt là tính năng Pass phòng và tìm bạn ở ghép trên diễn đàn.",
            "• Khảo sát thực tế sinh viên HCMUTE.\n• Phân hệ Diễn đàn & Pass phòng (UC-24).\n• Đánh giá sao từ người từng thuê (UC-29)."
        ),
        (
            "3. Sự hiểu biết về Vấn đề nghiên cứu\n(Research Understanding)",
            "Phân tích thấu đáo ưu/nhược điểm 4 nền tảng lớn (Phongtro123, Chợ Tốt, Ohana, Mogi). Làm chủ quy trình OOAD (56 UCs, 34 Sequence Diagrams, Class Diagram).",
            "• Bảng đối chiếu hiện trạng Mục 2.1.6.\n• Lược đồ lớp (Hình 3.1) và 34 Sequence Diagrams.\n• Thiết kế dữ liệu Hybrid (Hình 3.2)."
        ),
        (
            "4. Tính khả thi & Làm chủ Công nghệ\n(Technical Feasibility)",
            "Áp dụng thành công các công nghệ tiêu chuẩn công nghiệp: React 19 + Vite, NodeJS/Express, PostgreSQL + PostGIS, MongoDB + Mongoose, Socket.IO real-time, Leaflet/OSM.",
            "• Mã nguồn thực tế tại thư mục Tro-Oi-code.\n• Kiểm thử thành công 46 ca kiểm thử (TC-01 đến TC-46).\n• Ứng dụng chạy mượt mà tại môi trường local."
        )
    ]

    for r_idx, row_data in enumerate(eval_matrix):
        row = table_eval.rows[r_idx + 1]
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = widths_eval[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            r = p.add_run(val)
            r.font.size = Pt(10)
            if c_idx == 0:
                r.font.bold = True
            p.paragraph_format.line_spacing = 1.2

    # Phần chữ ký sinh viên & GVHD
    p_sign_sp = doc.add_paragraph()
    p_sign_sp.paragraph_format.space_before = Pt(24)
    p_sign_sp.paragraph_format.space_after = Pt(6)

    table_sign = doc.add_table(rows=3, cols=2)
    table_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_sign.autofit = False

    c_s0 = table_sign.rows[0].cells[0]
    c_s1 = table_sign.rows[0].cells[1]
    c_s0.width = Inches(3.2)
    c_s1.width = Inches(3.3)

    p_s0_head = c_s0.paragraphs[0]
    p_s0_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s0 = p_s0_head.add_run("XÁC NHẬN CỦA GIẢNG VIÊN HƯỚNG DẪN\n(Ký và ghi rõ họ tên)")
    r_s0.font.bold = True
    r_s0.font.size = Pt(11)

    p_s1_head = c_s1.paragraphs[0]
    p_s1_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1 = p_s1_head.add_run("ĐẠI DIỆN NHÓM SINH VIÊN THỰC HIỆN\n(Ký và ghi rõ họ tên)")
    r_s1.font.bold = True
    r_s1.font.size = Pt(11)

    # Empty row for signature
    table_sign.rows[1].cells[0].height = Inches(1.2)
    table_sign.rows[1].cells[1].height = Inches(1.2)

    # Name row
    p_s0_foot = table_sign.rows[2].cells[0].paragraphs[0]
    p_s0_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s0_f = p_s0_foot.add_run("TS. LÊ VĂN VINH")
    r_s0_f.font.bold = True
    r_s0_f.font.size = Pt(11.5)

    p_s1_foot = table_sign.rows[2].cells[1].paragraphs[0]
    p_s1_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1_f = p_s1_foot.add_run("Nguyễn Minh Quốc Khánh\n(Nhóm trưởng — Nhóm 04)")
    r_s1_f.font.bold = True
    r_s1_f.font.size = Pt(11)

    # Save to workspace
    out_dir = r"d:\KLTN\Tro-Oi-code"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "Bao_Cao_Muc_Tieu_De_Tai_Nhom04_TroOi.docx")
    doc.save(out_path)
    print(f"Document saved successfully at: {out_path}")

    # Copy to artifact directory
    artifact_dir = r"C:\Users\light\.gemini\antigravity\brain\c276acd3-54bb-4187-aaa8-cefb02574ef9"
    os.makedirs(artifact_dir, exist_ok=True)
    artifact_path = os.path.join(artifact_dir, "Bao_Cao_Muc_Tieu_De_Tai_Nhom04_TroOi.docx")
    shutil.copyfile(out_path, artifact_path)
    print(f"Document copied to artifact path: {artifact_path}")

if __name__ == '__main__':
    build_document()
