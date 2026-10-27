# Ảnh minh họa cho dữ liệu demo

Các ảnh trong `public/images/rooms/` được tải từ Pexels và dùng làm ảnh minh họa cho dữ liệu phòng mẫu, không đại diện cho phòng cho thuê thật. Khi đăng tin thật, chủ trọ cần thay bằng ảnh chụp căn phòng thực tế.

| Tệp | Nội dung | Nguồn |
| --- | --- | --- |
| `studio-kitchen.jpg` | Phòng studio có giường và cửa sổ | [Pexels photo 6487938](https://www.pexels.com/photo/studio-interior-with-bed-near-window-and-kitchen-6487938/) |
| `student-desk.jpg` | Phòng ngủ nhỏ có bàn học cạnh cửa sổ | [Pexels photo 20725943](https://www.pexels.com/photo/room-with-a-bed-and-a-desk-in-an-apartment-20725943/) |
| `city-window.jpg` | Phòng ngủ nhìn ra khu đô thị | [Pexels photo 4091969](https://www.pexels.com/photo/gray-bed-beside-the-glass-window-4091969/) |
| `scandinavian-room.jpg` | Phòng ngủ sáng, phong cách Scandinavian | [Pexels photo 34996523](https://www.pexels.com/photo/cozy-modern-scandinavian-apartment-bedroom-interior-34996523/) |
| `single-bed.jpg` | Phòng ngủ nhỏ với giường đơn | [Pexels photo 19878532](https://www.pexels.com/photo/small-bedroom-with-a-single-bed-19878532/) |
| `wood-accent-room.jpg` | Phòng ngủ có mảng tường gỗ | [Pexels photo 7045354](https://www.pexels.com/photo/an-interior-of-a-bedroom-7045354/) |
| `simple-bedroom.jpg` | Phòng ngủ tối giản | [Pexels photo 17994859](https://www.pexels.com/photo/interior-of-a-simple-bedroom-17994859/) |
| `blue-bedroom.jpg` | Phòng ngủ có bộ chăn xanh | [Pexels photo 13871317](https://www.pexels.com/photo/interior-design-of-a-small-bedroom-13871317/) |
| `compact-color-room.jpg` | Phòng nhỏ có giường và tủ gỗ | [Pexels photo 4115551](https://www.pexels.com/photo/small-room-with-bed-and-cupboard-4115551/) |
| `shared-dorm.jpg` | Giường tầng và không gian ở ghép | [Pexels photo 5158497](https://www.pexels.com/photo/clothes-hanging-on-a-bunk-bes-5158497/) |

Các trang ảnh trên ghi ảnh được dùng miễn phí theo giấy phép Pexels. Xem thêm [Pexels License](https://www.pexels.com/license/).

## Cập nhật dữ liệu PostgreSQL mẫu

Sau khi migration và seed tài khoản demo đã chạy, cập nhật riêng danh sách phòng và nội dung diễn đàn bằng:

```bash
pnpm db:seed:showcase
```

Lệnh này chỉ thêm/cập nhật các tin phòng và bài diễn đàn mẫu. Lệnh không đặt lại mật khẩu tài khoản, không sửa dữ liệu nhắn tin MongoDB và không xóa dữ liệu người dùng.
