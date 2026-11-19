import os
import re
import docx
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

SRC_FILE = r"C:\Users\light\.gemini\antigravity\brain\2a5ddedb-feb7-4500-ab85-d45df8ae4afb\.user_uploaded\media_1795073747903_a806c387.docx"
OUT_FILE_1 = r"D:\KLTN\Tro-Oi-code\Nhom04_CLCTV_NguyenMinhQuocKhanh_PhamMinhKhanh_HoangThanhTu.docx"
OUT_FILE_2 = r"D:\KLTN\Tro-Oi-code\Nhom04_CLCTV_NguyenMinhQuocKhanh_PhamMinhKhanh_HoangThanhTu_DaSua.docx"
IMG_DIR = r"D:\KLTN\Tro-Oi-code\docs\screenshots\report"

def main():
    print(f"Loading base document: {SRC_FILE}")
    doc = docx.Document(SRC_FILE)
    print(f"Total paragraphs in document: {len(doc.paragraphs)}")

    in_section_413 = False
    replaced_count = 0

    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if "4.1.3" in txt and "Giới thiệu giao diện" in txt and i > 500:
            in_section_413 = True
            print(f"--> Found Section 4.1.3 start at paragraph {i}")
            continue

        if in_section_413:
            if txt.startswith("4.2 ") or txt.startswith("Chương 5"):
                print(f"--> Reached end of Section 4.1.3 at paragraph {i}")
                break

            m = re.match(r"^Hình 4\.(\d+):?\s*(.*)$", txt)
            if m:
                fig_idx = int(m.group(1))
                fig_title = m.group(2)
                img_name = f"hinh_4_{fig_idx:02d}.png"
                img_path = os.path.join(IMG_DIR, img_name)

                if not os.path.exists(img_path):
                    print(f"WARNING: Image not found: {img_path}")
                    continue

                img_p = doc.paragraphs[i - 1]

                # Clear old runs and pictures
                for r in list(img_p.runs):
                    r._r.getparent().remove(r._r)

                # Add new image
                new_run = img_p.add_run()
                new_run.add_picture(img_path, width=Inches(5.85))

                # Format image paragraph
                img_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                img_p.paragraph_format.space_before = Pt(6)
                img_p.paragraph_format.space_after = Pt(4)

                # Format caption paragraph
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(12)

                replaced_count += 1
                print(f"  [{replaced_count:02d}/34] Updated Hình 4.{fig_idx}: {fig_title} with {img_name}")

    print(f"\nTotal figures updated: {replaced_count}/34")

    # Save to both target locations
    print(f"Saving to {OUT_FILE_1}...")
    doc.save(OUT_FILE_1)
    print(f"  Saved {OUT_FILE_1} (size: {os.path.getsize(OUT_FILE_1):,} bytes)")

    print(f"Saving to {OUT_FILE_2}...")
    doc.save(OUT_FILE_2)
    print(f"  Saved {OUT_FILE_2} (size: {os.path.getsize(OUT_FILE_2):,} bytes)")

    # Verify both can be loaded back
    doc_test = docx.Document(OUT_FILE_1)
    print(f"Verification: Successfully opened {OUT_FILE_1} ({len(doc_test.paragraphs)} paragraphs).")

if __name__ == "__main__":
    main()
