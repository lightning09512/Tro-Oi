import os
import re
import shutil
import zipfile
import xml.etree.ElementTree as ET
import docx
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import win32com.client
import fitz

BLACK = RGBColor(0, 0, 0)


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


def build_final_doc():
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
        p.paragraph_format.space_after = Pt(12)
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        set_run_style(r, size=14, bold=True)
        return p

    def add_h1(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        set_run_style(r, size=13, bold=True)
        return p

    def add_h2(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        set_run_style(r, size=13, bold=True, italic=True)
        return p

    def add_body_p(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.28
        p.paragraph_format.first_line_indent = Pt(28)
        r = p.add_run(text)
        set_run_style(r, size=13, bold=False)
        return p

    # =============================================================
    # MỤC TIÊU CỦA ĐỀ TÀI (CHI TIẾT, MẠCH LẠC, HỌC THUẬT)
    # =============================================================
    add_title("MỤC TIÊU CỦA ĐỀ TÀI")

    add_h1("1. Mục tiêu tổng quát")
    add_body_p(
        "Xuất phát từ thực tế thông tin cho thuê phòng trọ tại các đô thị lớn hiện nay còn phân tán, "
        "thiếu rõ ràng về các khoản chi phí sinh hoạt, đồng thời người thuê gặp nhiều khó khăn khi cần "
        "bàn giao lại phòng trước thời hạn hợp đồng, đề tài đặt mục tiêu xây dựng hoàn chỉnh website "
        "hỗ trợ tìm kiếm, chia sẻ và chuyển nhượng phòng trọ mang tên Trọ Ơi. Sản phẩm hướng tới việc "
        "phục vụ trực tiếp nhu cầu tìm chỗ ở và kết nối đời sống thuê trọ của sinh viên cũng như người "
        "lao động trẻ."
    )
    add_body_p(
        "Thay vì chỉ dừng lại ở mô hình đăng tin rao vặt một chiều, đề tài hướng đến việc kết hợp chức năng "
        "tra cứu phòng trọ với không gian tương tác cộng đồng trên cùng một nền tảng web. Thông qua đó, "
        "người thuê có thể tiếp cận nguồn tin được kiểm duyệt rõ ràng, tham khảo nhận xét thực tế và trao đổi "
        "trực tiếp với chủ trọ; đồng thời có kênh kết nối thuận tiện để tìm người ở ghép hoặc chuyển nhượng "
        "phòng khi thay đổi nơi học tập, làm việc. Về phía chủ nhà, hệ thống giúp chủ động đăng tải, cập nhật "
        "và theo dõi tình trạng phòng mà không phải phụ thuộc hoàn toàn vào trung gian."
    )

    add_h1("2. Mục tiêu cụ thể về chức năng và nghiệp vụ")

    add_h2("2.1. Chuẩn hóa trải nghiệm tìm kiếm và minh bạch thông tin phòng trọ")
    add_body_p(
        "Mục tiêu nghiệp vụ đầu tiên là rút ngắn thời gian tra cứu và thu hẹp khoảng cách giữa thông tin "
        "đăng tải trực tuyến với hiện trạng thực tế của phòng trọ. Hệ thống hỗ trợ khách vãng lai và người thuê "
        "tìm kiếm phòng theo từ khóa, khu vực hành chính, kết hợp bộ lọc nhiều tiêu chí gồm loại hình phòng, "
        "khoảng giá thuê, diện tích và các tiện ích đi kèm. Bên cạnh cách lọc thông thường, website tích hợp "
        "tính năng tìm kiếm bằng ngôn ngữ tự nhiên cùng trợ lý hỏi đáp nhằm tiếp nhận yêu cầu mô tả hằng ngày "
        "của người thuê và gợi ý những phòng phù hợp nhất."
    )
    add_body_p(
        "Song song với quá trình tìm kiếm, trang chi tiết phòng được xây dựng theo hướng đầy đủ và trực quan. "
        "Mỗi tin đăng trình bày rõ bộ ảnh phòng, mô tả hiện trạng, cơ cấu chi phí sinh hoạt gồm tiền thuê, "
        "tiền cọc, giá điện, nước và định vị trực tiếp vị trí phòng trên bản đồ số. Cách tổ chức thông tin này "
        "giúp người đi thuê có cơ sở so sánh khách quan giữa nhiều lựa chọn trước khi quyết định liên hệ và "
        "sắp xếp thời gian đến xem phòng thực tế."
    )

    add_h2("2.2. Xây dựng không gian cộng đồng, chuyển nhượng phòng và giao tiếp trực tiếp")
    add_body_p(
        "Mục tiêu thứ hai là tạo lập môi trường tương tác cộng đồng gắn liền với nhu cầu thực tế của người "
        "ở trọ. Website phát triển khu vực diễn đàn cho phép thành viên đăng bài chia sẻ kinh nghiệm thuê phòng, "
        "trao đổi thông tin khu vực, tìm bạn ở ghép có thói quen sinh hoạt phù hợp và đặc biệt là đăng tin "
        "chuyển nhượng phòng trọ khi cần dọn đi trước khi hết hạn hợp đồng. Người dùng có thể bình luận thảo luận, "
        "bày tỏ cảm xúc trên bài viết và truy cập nhanh hồ sơ của tác giả bài đăng để tìm hiểu thêm thông tin."
    )
    add_body_p(
        "Nhằm giúp quá trình trao đổi và thỏa thuận diễn ra liền mạch ngay trong hệ thống, đề tài hướng đến "
        "xây dựng tính năng nhắn tin hai chiều theo thời gian thực giữa người thuê, chủ trọ và người đăng tin "
        "chuyển nhượng. Kênh trò chuyện hỗ trợ gửi văn bản, hình ảnh, tệp tài liệu đính kèm, gửi lời hẹn xem "
        "phòng trực tiếp cũng như tìm kiếm thành viên để bắt đầu hội thoại. Bên cạnh đó, người thuê sau khi "
        "đăng nhập có thể quản lý hồ sơ cá nhân, lưu danh sách phòng yêu thích, gửi báo cáo đối với các nội dung "
        "có dấu hiệu sai phạm và thực hiện đánh giá phòng trọ. Để hạn chế tình trạng nhận xét thiếu khách quan, "
        "quyền đánh giá được ràng buộc theo dữ liệu nghiệp vụ, chỉ áp dụng đối với người thuê đã được chủ trọ "
        "xác nhận thuê phòng."
    )

    add_h2("2.3. Hỗ trợ quản lý phòng cho thuê và kiểm duyệt nội dung")
    add_body_p(
        "Đối với nhóm người dùng là chủ trọ, đề tài hướng đến việc xây dựng bộ công cụ quản lý gọn nhẹ, "
        "bao quát toàn bộ vòng đời của một tin cho thuê. Chủ trọ có thể tạo tin mới kèm thông số và hình ảnh, "
        "chỉnh sửa nội dung khi thay đổi điều kiện thuê, chủ động cập nhật trạng thái phòng giữa đang hiển thị, "
        "tạm ẩn hoặc đã cho thuê gắn với người thuê hiện tại. Ngoài ra, hệ thống cung cấp số liệu thống kê "
        "về lượt xem và lượt liên hệ giúp chủ nhà nắm bắt mức độ quan tâm đối với từng phòng."
    )
    add_body_p(
        "Đối với vai trò quản trị viên, mục tiêu cốt lõi là duy trì độ tin cậy của dữ liệu và giữ môi trường "
        "trao đổi lành mạnh thông qua cơ chế kiểm duyệt chủ động. Quản trị viên có quyền xét duyệt hoặc từ chối "
        "tin phòng mới đăng kèm lý do phản hồi qua thông báo, kiểm duyệt bài viết và bình luận trên diễn đàn, "
        "tiếp nhận và xử lý báo cáo vi phạm cũng như gửi cảnh báo tới các tài khoản vi phạm quy định. "
        "Phân hệ quản trị đồng thời hỗ trợ quản lý danh sách người dùng, phân quyền, khóa hoặc mở khóa tài khoản, "
        "quản lý danh mục khu vực, loại phòng, tiện ích, tổng hợp thống kê hoạt động theo kỳ và xuất báo cáo "
        "dưới định dạng Excel và PDF."
    )

    add_h1("3. Mục tiêu cụ thể về kỹ thuật, kiến trúc và phạm vi hoàn thiện")
    add_body_p(
        "Về mặt kiến trúc, đề tài hướng đến việc triển khai hệ thống theo mô hình Client – Server nhằm tách "
        "bạch giữa tầng giao diện và tầng xử lý nghiệp vụ, thuận lợi cho việc phân công phát triển, kiểm thử "
        "và bảo trì mã nguồn. Phía giao diện người dùng được xây dựng theo hướng ứng dụng trang đơn bằng ReactJS, "
        "TypeScript và Vite, tổ chức thành các thành phần giao diện có khả năng tái sử dụng và hiển thị ổn định "
        "trên cả màn hình máy tính lẫn thiết bị di động. Phía máy chủ được phát triển bằng NodeJS và ExpressJS "
        "theo chuẩn REST API, phân chia rành mạch các nhóm định tuyến xử lý yêu cầu, lớp trung gian xác thực "
        "và các dịch vụ dùng chung như gửi thư điện tử khôi phục mật khẩu và điều phối thông báo."
    )
    add_body_p(
        "Về tổ chức cơ sở dữ liệu và an toàn thông tin, hệ thống kết hợp hai hệ quản trị cơ sở dữ liệu phù hợp "
        "với từng loại dữ liệu nghiệp vụ. PostgreSQL mở rộng PostGIS đảm nhiệm việc lưu trữ dữ liệu quan hệ "
        "gồm tài khoản, tin cho thuê, tọa độ bản đồ, đánh giá, danh mục, báo cáo và bài viết diễn đàn nhằm "
        "đảm bảo tính nhất quán và ràng buộc dữ liệu. MongoDB được sử dụng để lưu trữ lịch sử hội thoại nhắn tin "
        "và thông báo nhằm đáp ứng tốt đặc thù ghi đọc linh hoạt của hoạt động giao tiếp. Bên cạnh đó, hệ thống "
        "tích hợp Socket.IO để truyền nhận tin nhắn tức thì, OpenStreetMap kết hợp Leaflet để hiển thị bản đồ "
        "trực quan và Cloudinary để lưu trữ hình ảnh. Toàn bộ mật khẩu người dùng được mã hóa một chiều bằng "
        "BCrypt, kết hợp xác thực và kiểm tra phân quyền tại máy chủ thông qua JWT theo vai trò và quyền sở hữu."
    )
    add_body_p(
        "Về quy trình thực hiện và phạm vi sản phẩm, đề tài đặt mục tiêu hoàn thiện bài bản từ bước khảo sát "
        "hiện trạng, phân tích đặc tả yêu cầu, thiết kế hệ thống đến lập trình thực nghiệm và kiểm thử các luồng "
        "chức năng trọng tâm trên môi trường cục bộ. Trong giới hạn của tiểu luận chuyên ngành, hệ thống tập trung "
        "hoàn thiện đầy đủ các luồng tìm kiếm, tương tác cộng đồng, chuyển nhượng phòng, nhắn tin và kiểm duyệt "
        "quản trị. Các bài toán đòi hỏi tích hợp tài chính và pháp lý sâu hơn như thanh toán qua cổng thanh toán "
        "trực tuyến, giữ tiền cọc trung gian hay xác thực phòng trọ thực địa nằm ngoài phạm vi hiện tại và được "
        "xác định cho giai đoạn phát triển mở rộng."
    )

    # Lưu file DOCX và dọn ảnh thừa
    out_repo = r"d:\KLTN\Tro-Oi-code\Bao_Cao_Muc_Tieu_De_Tai_Nhom04_TroOi.docx"
    doc.save(out_repo)
    prune_unused_media(out_repo)
    print("Saved:", out_repo)

    extra_targets = [
        r"D:\KLTN\Bao_Cao_Muc_Tieu_De_Tai_Nhom04_TroOi.docx",
        r"D:\KLTN\Nhom04_CLCTV_NguyenMinhQuocKhanh_PhamMinhKhanh_HoangThanhTu_Muc_Tieu_De_Tai.docx",
        r"C:\Users\light\.gemini\antigravity\brain\c276acd3-54bb-4187-aaa8-cefb02574ef9\Bao_Cao_Muc_Tieu_De_Tai_Nhom04_TroOi.docx",
    ]
    for target in extra_targets:
        try:
            shutil.copyfile(out_repo, target)
            print("Copied:", target)
        except Exception as e:
            print(f"Cannot copy to {target}: {e}")

    # Xuất PDF qua Word COM và chụp ảnh kiểm tra từng trang
    pdf_repo = r"d:\KLTN\Tro-Oi-code\Bao_Cao_Muc_Tieu_De_Tai_Nhom04_TroOi.pdf"
    pdf_art = r"C:\Users\light\.gemini\antigravity\brain\c276acd3-54bb-4187-aaa8-cefb02574ef9\Bao_Cao_Muc_Tieu_De_Tai_Nhom04_TroOi.pdf"
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
        img_path = rf"C:\Users\light\.gemini\antigravity\brain\c276acd3-54bb-4187-aaa8-cefb02574ef9\muc_tieu_v4_page_{i}.png"
        pix.save(img_path)
        print("Rendered:", img_path)
    pdf.close()


if __name__ == "__main__":
    build_final_doc()
