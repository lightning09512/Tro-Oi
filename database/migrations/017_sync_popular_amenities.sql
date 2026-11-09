INSERT INTO categories(type, name, status)
VALUES
  ('Tiện ích', 'Giường nệm', 'active'),
  ('Tiện ích', 'Wi-Fi tốc độ cao', 'active'),
  ('Tiện ích', 'Giờ giấc tự do', 'active'),
  ('Tiện ích', 'Camera an ninh', 'active')
ON CONFLICT(type, name) DO NOTHING;
