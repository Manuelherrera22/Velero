-- Crear más experiencias demo (con distintas ubicaciones y tags para probar filtros)
-- Pegar en Supabase → SQL Editor → Run

-- 1. Experiencia: Aventura en el Sur
WITH new_trip AS (
  INSERT INTO trips (captain_id, boat_id, title, description, location, capacity, price_per_person, full_boat_price, allow_full_boat, currency, status, tags, images, role_in_activity, requires_full_payment, min_passengers, max_passengers)
  SELECT 
    captain_id, boat_id, 
    'Expedición Náutica Bariloche', 
    'Aventura extrema por el lago Nahuel Huapi. Incluye equipo de pesca deportiva, almuerzo patagónico y bebidas calientes.', 
    'Bariloche, Río Negro', 
    6, 65000, 350000, true, 'ARS', 'published', 
    ARRAY['Aventura', 'Pesca', 'Relax'],
    ARRAY['https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=800&fit=crop', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&h=800&fit=crop'],
    'capitan', true, 1, 6
  FROM trips LIMIT 1
  RETURNING id
)
INSERT INTO trip_dates (trip_id, date, start_time, end_time, available_spots, is_active, price_per_person_override)
SELECT id, '2026-05-10'::date, '08:00:00'::time, '16:00:00'::time, 6, true, NULL::numeric FROM new_trip UNION ALL
SELECT id, '2026-05-11'::date, '08:00:00'::time, '16:00:00'::time, 6, true, NULL::numeric FROM new_trip UNION ALL
SELECT id, '2026-05-12'::date, '08:00:00'::time, '16:00:00'::time, 6, true, 70000::numeric FROM new_trip;

-- 2. Experiencia: Fiesta en Buenos Aires
WITH new_trip AS (
  INSERT INTO trips (captain_id, boat_id, title, description, location, capacity, price_per_person, full_boat_price, allow_full_boat, currency, status, tags, images, role_in_activity, requires_full_payment, min_passengers, max_passengers)
  SELECT 
    captain_id, boat_id, 
    'Yate Party en Nordelta', 
    'La mejor fiesta privada en el río con DJ a bordo, barra libre de tragos y catering. Ideal para cumpleaños y despedidas con amigos.', 
    'Nordelta, Buenos Aires', 
    12, 45000, 450000, true, 'ARS', 'published', 
    ARRAY['Fiesta', 'Amigos', 'Despedida'],
    ARRAY['https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=1200&h=800&fit=crop', 'https://images.unsplash.com/photo-1566440237731-1ee0618ce5c2?w=1200&h=800&fit=crop'],
    'capitan', true, 5, 12
  FROM trips LIMIT 1
  RETURNING id
)
INSERT INTO trip_dates (trip_id, date, start_time, end_time, available_spots, is_active, price_per_person_override)
SELECT id, '2026-05-15'::date, '22:00:00'::time, '04:00:00'::time, 12, true, NULL::numeric FROM new_trip UNION ALL
SELECT id, '2026-05-16'::date, '22:00:00'::time, '04:00:00'::time, 12, true, 50000::numeric FROM new_trip;

-- 3. Experiencia: Romántico en Zona Norte
WITH new_trip AS (
  INSERT INTO trips (captain_id, boat_id, title, description, location, capacity, price_per_person, full_boat_price, allow_full_boat, currency, status, tags, images, role_in_activity, requires_full_payment, min_passengers, max_passengers)
  SELECT 
    captain_id, boat_id, 
    'Noche Romántica bajo las Estrellas', 
    'Paseo exclusivo para parejas. Disfruten del atardecer y la noche con una cena de tres pasos y champagne francés bajo la luz de la luna.', 
    'San Isidro, Buenos Aires', 
    2, 80000, 160000, true, 'ARS', 'published', 
    ARRAY['Romántico', 'Parejas', 'Atardecer'],
    ARRAY['https://images.unsplash.com/photo-1510007551408-fb70e7e171cb?w=1200&h=800&fit=crop', 'https://images.unsplash.com/photo-1543343468-b77cd5bc4f4a?w=1200&h=800&fit=crop'],
    'capitan', true, 2, 2
  FROM trips LIMIT 1
  RETURNING id
)
INSERT INTO trip_dates (trip_id, date, start_time, end_time, available_spots, is_active, price_per_person_override)
SELECT id, '2026-05-14'::date, '19:00:00'::time, '23:00:00'::time, 2, true, NULL::numeric FROM new_trip UNION ALL
SELECT id, '2026-05-15'::date, '19:00:00'::time, '23:00:00'::time, 2, true, 90000::numeric FROM new_trip;
