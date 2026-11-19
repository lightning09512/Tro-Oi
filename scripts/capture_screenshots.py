import os
import json
import time
import requests
from playwright.sync_api import sync_playwright

BASE_API = "http://127.0.0.1:3001/api"
BASE_WEB = "http://localhost:8443"
OUT_DIR = os.path.abspath("docs/screenshots/report")
os.makedirs(OUT_DIR, exist_ok=True)

def get_user_session(identifier):
    r = requests.post(f"{BASE_API}/auth/login", json={"identifier": identifier, "password": "PhongTro@123"})
    if r.status_code == 200:
        d = r.json()
        return d.get('user'), d.get('token')
    raise Exception(f"Failed to login {identifier}: {r.status_code} {r.text}")

renter_user, renter_token = get_user_session("trang.nguyen@example.com")
landlord_user, landlord_token = get_user_session("minhngoc@example.com")
admin_user, admin_token = get_user_session("admin@phongtroplus.vn")

print("Renter session OK:", renter_user['id'])
print("Landlord session OK:", landlord_user['id'])
print("Admin session OK:", admin_user['id'])

def run_capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            headless=True
        )
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1.5
        )
        page = context.new_page()

        def set_auth(user, token):
            page.evaluate(f"""() => {{
                localStorage.setItem('trooi_access_token', '{token}');
                localStorage.setItem('phongtroplus_auth_user', JSON.stringify({json.dumps(user)}));
                sessionStorage.removeItem('trooi_access_token');
                sessionStorage.removeItem('phongtroplus_auth_user');
            }}""")

        def clear_auth():
            page.evaluate("""() => {
                localStorage.clear();
                sessionStorage.clear();
            }""")

        def snap(num_str, url=None, setup_fn=None, delay=1.2):
            print(f"--> Capturing Hình {num_str}...")
            if url:
                page.goto(url, wait_until="domcontentloaded")
            if setup_fn:
                setup_fn()
            time.sleep(delay)
            fn = f"hinh_{num_str.replace('.', '_')}.png"
            dest = os.path.join(OUT_DIR, fn)
            page.screenshot(path=dest)
            print(f"    Saved {fn} ({os.path.getsize(dest)} bytes)")

        # Clear auth for guest pages
        page.goto(f"{BASE_WEB}/", wait_until="domcontentloaded")
        clear_auth()

        # 4.1 Trang chủ
        snap("4.01", f"{BASE_WEB}/", delay=1.5)

        # 4.2 Tìm kiếm phòng
        snap("4.02", f"{BASE_WEB}/tim-phong", delay=1.5)

        # 4.3 Chi tiết phòng
        snap("4.03", f"{BASE_WEB}/phong/tromoi-105-ung-van-khiem", delay=1.5)

        # 4.4 Đăng ký
        snap("4.04", f"{BASE_WEB}/dang-ky", delay=1.0)

        # 4.5 Đăng nhập
        snap("4.05", f"{BASE_WEB}/dang-nhap", delay=1.0)

        # 4.6 Quên mật khẩu
        snap("4.06", f"{BASE_WEB}/quen-mat-khau", delay=1.0)

        # 4.7 Đặt lại mật khẩu
        snap("4.07", f"{BASE_WEB}/dat-lai-mat-khau", delay=1.0)

        # 4.8 Hồ sơ công khai thành viên
        snap("4.08", f"{BASE_WEB}/nguoi-dung/user-landlord-01", delay=1.2)

        # Renter pages
        page.goto(f"{BASE_WEB}/", wait_until="domcontentloaded")
        set_auth(renter_user, renter_token)

        # 4.9 Quản lý hồ sơ cá nhân
        snap("4.09", f"{BASE_WEB}/tai-khoan/ho-so", delay=1.2)

        # 4.10 Đổi mật khẩu
        snap("4.10", f"{BASE_WEB}/tai-khoan/doi-mat-khau", delay=1.2)

        # 4.11 Yêu thích
        snap("4.11", f"{BASE_WEB}/yeu-thich", delay=1.2)

        # 4.12 Thông báo người thuê
        snap("4.12", f"{BASE_WEB}/thong-bao", delay=1.2)

        # 4.13 Nhắn tin
        snap("4.13", f"{BASE_WEB}/tin-nhan", delay=1.5)

        # 4.14 Báo cáo người thuê
        snap("4.14", f"{BASE_WEB}/bao-cao-cua-toi", delay=1.2)

        # 4.15 Diễn đàn
        snap("4.15", f"{BASE_WEB}/dien-dan", delay=1.5)

        # 4.16 Chi tiết bài viết diễn đàn
        snap("4.16", f"{BASE_WEB}/bai-viet/pass-forum-post-01", delay=1.5)

        # 4.17 Tạo bài viết chia sẻ / Pass phòng
        def open_create_modal():
            try:
                btn = page.query_selector(".fb-composer-input-pill, .fb-composer-action-btn")
                if btn:
                    btn.click()
                time.sleep(0.5)
            except Exception as e:
                print("Modal click error:", e)
        snap("4.17", f"{BASE_WEB}/dien-dan", setup_fn=open_create_modal, delay=1.0)

        # Landlord pages
        page.goto(f"{BASE_WEB}/", wait_until="domcontentloaded")
        set_auth(landlord_user, landlord_token)

        # 4.18 Thống kê chủ trọ
        snap("4.18", f"{BASE_WEB}/chu-tro/thong-ke", delay=1.5)

        # 4.19 Quản lý danh sách tin
        snap("4.19", f"{BASE_WEB}/chu-tro/quan-ly-tin", delay=1.5)

        # 4.20 Đăng tin mới
        snap("4.20", f"{BASE_WEB}/chu-tro/dang-tin", delay=1.2)

        # 4.21 Sửa tin
        snap("4.21", f"{BASE_WEB}/chu-tro/tin/tromoi-105-ung-van-khiem/chinh-sua", delay=1.5)

        # Admin Login
        clear_auth()
        # 4.22 Đăng nhập quản trị
        snap("4.22", f"{BASE_WEB}/admin/dang-nhap", delay=1.0)

        # Admin pages
        page.goto(f"{BASE_WEB}/", wait_until="domcontentloaded")
        set_auth(admin_user, admin_token)

        # 4.23 Dashboard
        snap("4.23", f"{BASE_WEB}/admin", delay=1.5)

        # 4.24 Quản lý người dùng
        snap("4.24", f"{BASE_WEB}/admin/nguoi-dung", delay=1.5)

        # 4.25 Quản lý tin cho thuê
        snap("4.25", f"{BASE_WEB}/admin/tin-cho-thue", delay=1.5)

        # 4.26 Quản lý diễn đàn
        snap("4.26", f"{BASE_WEB}/admin/dien-dan", delay=1.5)

        # 4.27 Quản lý danh mục
        snap("4.27", f"{BASE_WEB}/admin/danh-muc", delay=1.5)

        # 4.28 Quản lý báo cáo vi phạm
        snap("4.28", f"{BASE_WEB}/admin/bao-cao", delay=1.5)

        # 4.29 Thống kê hệ thống
        snap("4.29", f"{BASE_WEB}/admin/thong-ke", delay=1.5)

        # 4.30 Hồ sơ admin
        snap("4.30", f"{BASE_WEB}/admin/ho-so", delay=1.2)

        # 4.31 Đổi mật khẩu admin
        snap("4.31", f"{BASE_WEB}/admin/doi-mat-khau", delay=1.2)

        # 4.32 Thông báo admin
        snap("4.32", f"{BASE_WEB}/admin/thong-bao", delay=1.2)

        # Error pages
        clear_auth()
        # 4.33 403 Forbidden
        snap("4.33", f"{BASE_WEB}/403", delay=1.0)

        # 4.34 404 Not Found
        snap("4.34", f"{BASE_WEB}/404", delay=1.0)

        browser.close()
        print("\n=== ALL 34 SCREENSHOTS CAPTURED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_capture()
