INSERT INTO node VALUES
  ('id_01', 'https://alpha.com', 'https://bravo-alt.com', 'Apple'),
  ('id_02', 'https://bravo.com https://bravo-alt.com', 'https://charlie.com', 'Apple v2'),
  ('id_03', 'https://delta.com', 'https://alpha.com https://bravo.com', 'Orange'),
  ('id_04', 'https://echo.com https://foxtrot.com', 'https://alpha.com https://charlie.com https://echo.com', 'Orange apple'),
  ('id_05', 'https://golf.com', 'https://charlie.com', 'App center'),
  ('id_06', 'https://hotel.com', 'https://bravo.com https://charlie.com', 'Banana apps')
ON CONFLICT DO NOTHING;
