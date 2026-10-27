INSERT INTO categories(type,name)
VALUES ('Loại phòng','Căn hộ')
ON CONFLICT(type,name) DO NOTHING;
