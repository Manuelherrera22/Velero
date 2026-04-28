-- Demo: 3 días × 3 horarios con precios dinámicos para "Atardecer Dorado en el Delta"
-- Pegar en Supabase → SQL Editor → Run

INSERT INTO trip_dates (trip_id, date, start_time, end_time, available_spots, is_active, price_per_person_override, full_boat_price_override) VALUES
-- Día 1: miércoles 30 abr
('c4ef7c89-e389-47fa-9931-3054c716b2bb', '2026-04-30', '10:00:00', '12:30:00', 8, true, NULL, NULL),
('c4ef7c89-e389-47fa-9931-3054c716b2bb', '2026-04-30', '14:00:00', '16:30:00', 6, true, 32000, 180000),
('c4ef7c89-e389-47fa-9931-3054c716b2bb', '2026-04-30', '17:30:00', '20:00:00', 4, true, 38000, 220000),
-- Día 2: viernes 2 may
('c4ef7c89-e389-47fa-9931-3054c716b2bb', '2026-05-02', '10:00:00', '12:30:00', 8, true, NULL, NULL),
('c4ef7c89-e389-47fa-9931-3054c716b2bb', '2026-05-02', '14:00:00', '16:30:00', 6, true, 32000, 180000),
('c4ef7c89-e389-47fa-9931-3054c716b2bb', '2026-05-02', '17:30:00', '20:00:00', 4, true, 38000, 220000),
-- Día 3: domingo 4 may
('c4ef7c89-e389-47fa-9931-3054c716b2bb', '2026-05-04', '10:00:00', '12:30:00', 8, true, NULL, NULL),
('c4ef7c89-e389-47fa-9931-3054c716b2bb', '2026-05-04', '14:00:00', '16:30:00', 6, true, 32000, 180000),
('c4ef7c89-e389-47fa-9931-3054c716b2bb', '2026-05-04', '17:30:00', '20:00:00', 4, true, 38000, 220000);
