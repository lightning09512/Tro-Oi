import os
import re
import shutil
import zipfile
import xml.etree.ElementTree as ET
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import win32com.client
import fitz

BLACK = RGBColor(0, 0, 0)


def set_cell_white(cell):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="FFFFFF"/>')
    tcPr.append(shd)


def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement("w:tcMar")
    for m, val in [("top", top), ("bottom", bottom), ("left", left), ("right", right)]:
        node = OxmlElement(f"w:{m}")
        node.set(qn("w:w"), str(val))
        node.set(qn("w:type"), "dxa")
        tcMar.append(node)
    tcPr.append(tcMar)


def set_row_cant_split(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(OxmlElement("w:cantSplit"))


def set_row_header(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(OxmlElement("w:tblHeader"))


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


def prune_unused_media(docx_path):
    """Loại bỏ các ảnh thừa từ file báo cáo gốc để dung lượng file Word gọn nhẹ (< 5MB)."""
    tmp_path = docx_path + ".tmp.zip"
    with zipfile.ZipFile(docx_path, "r") as zin:
        used_rids = set()
        for info in zin.infolist():
            if info.filename.startswith("word/") and info.filename.endswith(".xml"):
                xml_text = zin.read(info.filename).decode("utf-8", errors="ignore")
                used_rids.update(re.findall(r'r:(?:embed|id|link)="(rId\d+)"', xml_text))
                used_rids.update(re.findall(r'Id="(rId\d+)"', xml_text))

        kept_media = set()
        rels_path = "word/_rels/document.xml.rels"
        rels_xml_bytes = None
        if rels_path in zin.namelist():
            ns_uri = "http://schemas.openxmlformats.org/package/2006/relationships"
            ET.register_namespace("", ns_uri)
            root = ET.fromstring(zin.read(rels_path))
            for rel in list(root):
                rid = rel.attrib.get("Id", "")
                target = rel.attrib.get("Target", "")
                if target.startswith("media/"):
                    if rid in used_rids:
                        kept_media.add("word/" + target)
                    else:
                        root.remove(rel)
            rels_xml_bytes = ET.tostring(root, encoding="utf-8", xml_declaration=True)

        for info in zin.infolist():
            if info.filename.startswith("word/_rels/") and info.filename.endswith(".rels") and info.filename != rels_path:
                rel_text = zin.read(info.filename).decode("utf-8", errors="ignore")
                for target in re.findall(r'Target="(media/[^"]+)"', rel_text):
                    kept_media.add("word/" + target)

        with zipfile.ZipFile(tmp_path, "w", compression=zipfile.ZIP_DEFLATED) as zout:
            for info in zin.infolist():
                if info.filename.startswith("word/media/") and info.filename not in kept_media:
                    continue
                if info.filename == rels_path and rels_xml_bytes is not None:
                    zout.writestr(info, rels_xml_bytes)
                else:
                    zout.writestr(info, zin.read(info.filename))

    os.replace(tmp_path, docx_path)
    size_kb = os.path.getsize(docx_path) / 1024
    print(f"Pruned unused media (kept {len(kept_media)} media files) -> {size_kb:.1f} KB")


def build_scope_doc():
    # Mở file báo cáo gốc để giữ nguyên khung trang bìa chuẩn HCMUTE
    template_path = r"D:\KLTN\Nhom04_CLCTV_NguyenMinhQuocKhanh_PhamMinhKhanh_HoangThanhTu.docx"
    doc = docx.Document(template_path)

    # Xóa toàn bộ bảng và nội dung sau trang bìa
    for t in list(doc.tables):
        t._tbl.getparent().remove(t._tbl)
    for p in list(doc.paragraphs[22:]):
        p._p.getparent().remove(p._p)

    # Ẩn số trang ở trang bìa
    if doc.sections:
        sect = doc.sections[-1]
        sect.different_first_page_header_footer = True
        for fp in list(sect.first_page_footer.paragraphs):
            fp.text = ""

    # Cập nhật tháng ở dòng cuối bìa (giữ nguyên ngắt trang ở run tiếp theo)
    p_last = doc.paragraphs[21]
    for r in p_last.runs:
        if "tháng 09" in r.text:
            r.text = r.text.replace("tháng 09", "tháng 11")

    def set_run_style(run, size=13, bold=False, italic=False):
        run.font.name = "Times New Roman"
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.italic = italic
        run.font.color.rgb = BLACK

    def add_title(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(10)
        p.paragraph_format.line_spacing = 1.25
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        set_run_style(r, size=14, bold=True)
        return p

    def add_h1(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.2
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        set_run_style(r, size=13, bold=True)
        return p

    def add_h2(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2.5)
        p.paragraph_format.line_spacing = 1.2
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        set_run_style(r, size=13, bold=True, italic=True)
        return p

    def add_body_p(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3.5)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.first_line_indent = Pt(28)
        r = p.add_run(text)
        set_run_style(r, size=13, bold=False)
        return p

    # =============================================================
    # PHẦN 2: PHẠM VI CỦA ĐỀ TÀI
    # =============================================================
    add_title("PHẠM VI CỦA ĐỀ TÀI")

    add_h1("1. Phạm vi tổng quan và đối tượng sử dụng")
    add_body_p(
        "Phạm vi của đề tài bám sát tên đề tài đã được duyệt là xây dựng website hỗ trợ tìm kiếm, "
        "chia sẻ và chuyển nhượng phòng trọ với tên gọi Trọ Ơi. Đây là căn cứ để nhóm phân tích nghiệp vụ, "
        "xác định đặc tả yêu cầu và lựa chọn giải pháp thiết kế trong suốt thời gian thực hiện tiểu luận chuyên ngành. "
        "Về nền tảng vận hành, hệ thống được xây dựng dưới dạng ứng dụng web chạy trên trình duyệt máy tính và thiết bị di động."
    )
    add_body_p(
        "Về đối tượng người dùng, hệ thống phục vụ bốn nhóm tác nhân gồm khách vãng lai, người thuê, chủ trọ "
        "và quản trị viên. Trong đó, khách vãng lai đại diện cho trạng thái người dùng chưa đăng nhập nên chỉ truy cập "
        "được các trang công khai như tra cứu phòng, xem chi tiết phòng, đọc diễn đàn, xem hồ sơ công khai hoặc đăng ký, "
        "đăng nhập. Ba vai trò có tài khoản là người thuê, chủ trọ và quản trị viên được phân quyền truy cập và kiểm tra "
        "quyền sở hữu dữ liệu ở phía máy chủ."
    )

    add_h1("2. Những phần hệ thống thực hiện (Trong phạm vi)")

    add_h2("2.1. Tra cứu, lọc thông tin phòng trọ và hiển thị bản đồ")
    add_body_p(
        "Website triển khai các chức năng tìm kiếm phòng trọ theo từ khóa, khu vực hành chính, kết hợp bộ lọc theo "
        "loại phòng, khoảng giá thuê, diện tích và các tiện ích đi kèm. Hệ thống hỗ trợ phân trang danh sách kết quả, "
        "sắp xếp theo thời gian hoặc mức giá, đồng thời bổ sung tính năng tìm kiếm bằng câu truy vấn ngôn ngữ tự nhiên "
        "và khung trò chuyện trợ lý nhằm phân tích nhu cầu khu vực, ngân sách, tiện ích để gợi ý danh sách phòng phù hợp "
        "từ cơ sở dữ liệu hiện có."
    )
    add_body_p(
        "Trang chi tiết phòng hiển thị đầy đủ hình ảnh, mô tả, thông tin tiền thuê, tiền cọc, tiện ích, số điện thoại "
        "liên hệ và vị trí trên bản đồ OpenStreetMap thông qua thư viện Leaflet đối với những tin đăng có tọa độ hợp lệ. "
        "Ngoài ra, hệ thống ghi nhận lượt xem, lượt bấm liên hệ và hỗ trợ người dùng đã đăng nhập lưu các tin phòng "
        "vào danh sách yêu thích."
    )

    add_h2("2.2. Quản lý tin cho thuê, cộng đồng diễn đàn và nhắn tin trực tiếp")
    add_body_p(
        "Đối với vai trò chủ trọ, hệ thống hỗ trợ tạo mới, chỉnh sửa, xóa tin cho thuê, nhập tùy chọn tọa độ bản đồ, "
        "cập nhật trạng thái tin giữa chờ duyệt, đang hiển thị, tạm ẩn hoặc đã cho thuê gắn với tài khoản người thuê "
        "hiện tại, cùng màn hình thống kê lượt xem và lượt liên hệ. Đối với nhu cầu tương tác và chuyển nhượng phòng, "
        "chuyên mục diễn đàn cho phép thành viên đăng bài chia sẻ kinh nghiệm thuê trọ, tìm bạn ở ghép và đăng bài "
        "chuyển nhượng phòng, đồng thời hỗ trợ tìm kiếm bài viết, bình luận phản hồi và bày tỏ cảm xúc."
    )
    add_body_p(
        "Hệ thống cũng cung cấp chức năng quản lý tài khoản gồm đăng ký xác nhận qua email, đăng nhập, cập nhật hồ sơ "
        "cá nhân, đổi mật khẩu và khôi phục mật khẩu. Người thuê đã được ghi nhận thuê phòng ở trạng thái đã cho thuê "
        "có quyền gửi đánh giá sao và nhận xét về phòng đó. Khi cần trao đổi trực tiếp, người thuê và chủ trọ hoặc "
        "người đăng tin chuyển nhượng có thể tìm kiếm thành viên theo số điện thoại và nhắn tin thời gian thực hai chiều "
        "kèm hình ảnh, tệp đính kèm, tin nhắn gợi ý hẹn xem phòng và ảnh mã VietQR tham khảo. Các nội dung sai phạm "
        "trên tin đăng, bài viết hoặc bình luận đều có luồng gửi báo cáo và theo dõi trạng thái xử lý."
    )

    add_h2("2.3. Kiểm duyệt, quản trị hệ thống và cấu trúc giải pháp kỹ thuật")
    add_body_p(
        "Phân hệ quản trị hỗ trợ duyệt hoặc từ chối tin phòng mới đăng kèm lý do phản hồi thông qua thông báo, "
        "quản lý tài khoản người dùng gồm thêm, sửa, xóa, khóa hoặc mở khóa và phân quyền, quản lý danh mục khu vực, "
        "loại phòng, tiện ích, kiểm duyệt bài viết và bình luận trên diễn đàn, xử lý báo cáo vi phạm và gửi cảnh báo. "
        "Quản trị viên cũng có thể theo dõi số liệu thống kê hoạt động theo khoảng thời gian và xuất tệp báo cáo dạng "
        "Excel hoặc PDF."
    )
    add_body_p(
        "Về giải pháp kỹ thuật, giao diện được xây dựng bằng ReactJS, TypeScript và Vite; máy chủ API xây dựng bằng "
        "NodeJS và ExpressJS; lớp hỗ trợ tìm kiếm ngữ nghĩa dùng Python FastAPI kết hợp dịch vụ Gemini API. Dữ liệu "
        "quan hệ gồm tài khoản, tin phòng, tọa độ địa lý, đánh giá, bài viết diễn đàn, danh mục và báo cáo được lưu "
        "trong PostgreSQL có PostGIS, còn lịch sử hội thoại nhắn tin và thông báo lưu trong MongoDB. Ảnh tải lên được "
        "lưu cục bộ khi phát triển hoặc qua Cloudinary, giao tiếp tức thì sử dụng Socket.IO, mật khẩu băm bằng BCrypt "
        "và phân quyền xác thực bằng JWT. Giao diện cũng hỗ trợ chế độ trình diễn độc lập để phục vụ kiểm tra hiển thị "
        "khi chưa kết nối dịch vụ bên ngoài."
    )

    add_h1("3. Những phần hệ thống không thực hiện (Ngoài phạm vi)")
    add_body_p(
        "Thứ nhất, hệ thống không tích hợp cổng thanh toán trực tuyến, không thu hộ hay giữ tiền cọc trung gian và "
        "không kết nối ngân hàng để đối soát giao dịch tự động. Tính năng tạo mã VietQR trong khung nhắn tin chỉ đóng "
        "vai trò tạo ảnh thông tin chuyển khoản tham khảo để hai bên tự trao đổi, không phải nghiệp vụ thanh toán trên nền tảng."
    )
    add_body_p(
        "Thứ hai, đề tài không triển khai quy trình khảo sát phòng trọ thực địa và không thực hiện định danh giấy tờ "
        "tùy thân điện tử đối với chủ trọ hay người thuê. Hệ thống cũng không cung cấp chức năng ký kết hợp đồng điện tử "
        "có giá trị pháp lý; mọi thỏa thuận thuê phòng và bàn giao chuyển nhượng được thực hiện trực tiếp bên ngoài hệ thống, "
        "còn chất lượng tin đăng trên website được kiểm soát thông qua bước duyệt của quản trị viên và báo cáo từ cộng đồng."
    )
    add_body_p(
        "Thứ ba, hệ thống không xây dựng ứng dụng di động riêng cho iOS hay Android mà chỉ hỗ trợ truy cập qua trình duyệt "
        "web. Trang tìm kiếm cũng chưa triển khai nút tự động lấy tọa độ GPS từ trình duyệt của người dùng để tìm quanh "
        "vị trí hiện tại; dữ liệu bản đồ tập trung vào hiển thị vị trí phòng dựa trên tọa độ do người đăng cung cấp tùy chọn."
    )
    add_body_p(
        "Thứ tư, trong phạm vi đồ án, hệ thống chưa xây dựng cơ chế thu hồi JWT tức thì phía máy chủ bằng danh sách đen "
        "khi người dùng đăng xuất (thao tác đăng xuất xóa phiên ở trình duyệt, còn máy chủ kiểm tra trạng thái tài khoản "
        "khi xác thực), đồng thời chưa triển khai kiến trúc chịu tải cao phân tán cho môi trường thương mại quy mô lớn."
    )

    add_h1("4. Bảng tổng hợp đối chiếu phạm vi thực hiện")
    table = doc.add_table(rows=6, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_academic_grid_borders(table)

    headers = ["Khía cạnh", "Thực hiện\n(Trong phạm vi)", "Không thực hiện\n(Ngoài phạm vi)"]
    widths = [Inches(1.25), Inches(2.65), Inches(2.6)]

    row0 = table.rows[0]
    set_row_cant_split(row0)
    set_row_header(row0)
    for idx, title in enumerate(headers):
        cell = row0.cells[idx]
        cell.width = widths[idx]
        set_cell_white(cell)
        set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(title)
        set_run_style(r, size=12, bold=True)

    rows_data = [
        (
            "Tìm kiếm &\nBản đồ",
            "Tìm theo từ khóa, khu vực, bộ lọc giá, diện tích, tiện ích; tìm bằng câu tự nhiên và trợ lý gợi ý; hiển thị vị trí phòng trên bản đồ OpenStreetMap/Leaflet.",
            "Chưa tích hợp nút tự động lấy vị trí GPS từ trình duyệt người dùng để quét phòng quanh thiết bị."
        ),
        (
            "Thuê & Chuyển nhượng",
            "Đăng bài chuyển nhượng phòng, tìm ở ghép, chia sẻ kinh nghiệm trên diễn đàn; đánh giá phòng gắn với người thuê thực tế; hẹn xem phòng qua tin nhắn.",
            "Không ký hợp đồng thuê hay hợp đồng chuyển nhượng điện tử trên hệ thống; các bên tự thỏa thuận trực tiếp."
        ),
        (
            "Thanh toán &\nĐặt cọc",
            "Hiển thị thông tin tiền thuê, tiền cọc minh bạch; hỗ trợ gửi ảnh mã VietQR tham khảo trong khung trò chuyện giữa hai bên.",
            "Không tích hợp cổng thanh toán trực tuyến, không giữ tiền cọc trung gian và không tự động xác nhận giao dịch ngân hàng."
        ),
        (
            "Kiểm duyệt &\nTin cậy",
            "Quản trị viên duyệt tin phòng, ẩn/gỡ bài viết và bình luận vi phạm, khóa tài khoản, xử lý báo cáo và gửi cảnh báo; xuất thống kê Excel/PDF.",
            "Không khảo sát xác thực phòng thực địa như nhân sự kiểm tra hiện trường và không định danh giấy tờ tùy thân điện tử."
        ),
        (
            "Nền tảng &\nVận hành",
            "Ứng dụng web đáp ứng trên máy tính và di động (ReactJS, NodeJS, PostgreSQL/PostGIS, MongoDB, Socket.IO, Cloudinary, JWT, BCrypt).",
            "Không phát triển ứng dụng di động riêng cho iOS/Android; chưa thu hồi JWT bằng danh sách đen khi đăng xuất và chưa tối ưu tải thương mại quy mô lớn."
        ),
    ]

    for r_idx, row_vals in enumerate(rows_data):
        row = table.rows[r_idx + 1]
        set_row_cant_split(row)
        for c_idx, val in enumerate(row_vals):
            cell = row.cells[c_idx]
            cell.width = widths[c_idx]
            set_cell_white(cell)
            set_cell_margins(cell, top=50, bottom=50, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.12
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            set_run_style(r, size=11.5, bold=(c_idx == 0))

    # Lưu file DOCX và dọn ảnh thừa
    out_repo = r"d:\KLTN\Tro-Oi-code\Bao_Cao_Pham_Vi_De_Tai_Nhom04_TroOi.docx"
    doc.save(out_repo)
    prune_unused_media(out_repo)
    print("Saved:", out_repo)

    extra_targets = [
        r"D:\KLTN\Bao_Cao_Pham_Vi_De_Tai_Nhom04_TroOi.docx",
        r"D:\KLTN\Nhom04_CLCTV_NguyenMinhQuocKhanh_PhamMinhKhanh_HoangThanhTu_Pham_Vi_De_Tai.docx",
        r"C:\Users\light\.gemini\antigravity\brain\c276acd3-54bb-4187-aaa8-cefb02574ef9\Bao_Cao_Pham_Vi_De_Tai_Nhom04_TroOi.docx",
    ]
    for target in extra_targets:
        try:
            shutil.copyfile(out_repo, target)
            print("Copied:", target)
        except Exception as e:
            print(f"Cannot copy to {target}: {e}")

    # Xuất PDF qua Word COM và chụp ảnh kiểm tra từng trang
    pdf_repo = r"d:\KLTN\Tro-Oi-code\Bao_Cao_Pham_Vi_De_Tai_Nhom04_TroOi.pdf"
    pdf_art = r"C:\Users\light\.gemini\antigravity\brain\c276acd3-54bb-4187-aaa8-cefb02574ef9\Bao_Cao_Pham_Vi_De_Tai_Nhom04_TroOi.pdf"
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        wdoc = word.Documents.Open(os.path.abspath(out_repo))
        wdoc.SaveAs(os.path.abspath(pdf_repo), FileFormat=17)
        wdoc.Close(False)
    finally:
        word.Quit()

    try:
        shutil.copyfile(pdf_repo, pdf_art)
    except Exception as e:
        print("Cannot copy pdf to art:", e)

    pdf = fitz.open(pdf_repo)
    print("Total PDF pages:", len(pdf))
    for i, page in enumerate(pdf):
        pix = page.get_pixmap(dpi=150)
        img_path = rf"C:\Users\light\.gemini\antigravity\brain\c276acd3-54bb-4187-aaa8-cefb02574ef9\pham_vi_page_{i}.png"
        pix.save(img_path)
        print("Rendered:", img_path)
    pdf.close()


if __name__ == "__main__":
    build_scope_doc()
