const mongoose = require('mongoose');

async function seed() {
  await mongoose.connect('mongodb://127.0.0.1:27017/trooi');
  const col = mongoose.connection.collection('notifications');
  await col.deleteMany({});

  const sampleNotifications = [
    {
      userId: 'user-renter-01',
      title: 'Chào mừng bạn đến với Trọ Ơi!',
      detail: 'Chúc mừng bạn đã tạo tài khoản thành công. Bắt đầu tìm kiếm hàng trăm phòng trọ đã xác thực vị trí và giá tốt quanh khu vực TP. Hồ Chí Minh.',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 25), // 25 mins ago
      updatedAt: new Date()
    },
    {
      userId: 'user-renter-01',
      title: 'Chủ trọ đã phản hồi tin nhắn của bạn',
      detail: 'Chị Minh Ngọc đã gửi tin nhắn xác nhận lịch xem phòng tại Quang Trung, Gò Vấp vào lúc 16:30 chiều mai.',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      updatedAt: new Date()
    },
    {
      userId: 'user-renter-01',
      title: 'Có phòng trọ mới phù hợp với bạn',
      detail: 'Phòng Studio ban công thoáng mát tại Quận Bình Thạnh (giá 4.2 triệu/tháng) vừa được đăng gần khu vực bạn quan tâm.',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      updatedAt: new Date()
    },
    {
      userId: 'user-renter-01',
      title: 'Bài viết nổi bật trên Diễn đàn Trọ Ơi',
      detail: 'Chủ đề "Kinh nghiệm kiểm tra hợp đồng thuê trọ sinh viên tránh mất cọc" đang nhận được nhiều phản hồi tích cực từ cộng đồng.',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      updatedAt: new Date()
    },
    {
      userId: 'user-landlord-01',
      title: 'Tin đăng phòng trọ đã được phê duyệt',
      detail: 'Tin "Phòng trọ cao cấp có gác lửng Quang Trung, Gò Vấp" của bạn đã được kiểm duyệt thành công và đang hiển thị công khai.',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
      updatedAt: new Date()
    },
    {
      userId: 'user-landlord-01',
      title: 'Khách thuê hẹn lịch xem phòng',
      detail: 'Bạn Trang Nguyễn đã nhắn tin hỏi thăm và xin hẹn xem phòng vào 16:30 chiều mai.',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 180),
      updatedAt: new Date()
    },
    {
      userId: 'user-admin-01',
      title: 'Báo cáo tổng kết hệ thống Trọ Ơi',
      detail: 'Hệ thống đã đồng bộ toàn bộ dữ liệu người dùng, tin đăng và kiểm duyệt. Mọi dịch vụ đang vận hành ổn định.',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
      updatedAt: new Date()
    },
    {
      userId: 'user-admin-01',
      title: 'Có tin đăng mới chờ kiểm duyệt',
      detail: 'Chủ trọ Minh Ngọc vừa cập nhật lại thông tin tiện ích phòng trọ tại Quận Gò Vấp.',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      updatedAt: new Date()
    }
  ];

  await col.insertMany(sampleNotifications);
  console.log('Seeded notifications count:', sampleNotifications.length);
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
