-- ============================================
-- SCRIPT DE BAJA DE USUARIOS PARA PRUEBAS
-- Ejecutar en el SQL Editor de Supabase
-- ============================================
-- Emails a dar de baja:
--   1. haccorinti@naturgy.com.ar
--   2. hernanacco@gmail.com
--   3. hernanacco@kailu.travel
--   4. herdaracco@gmail.com
-- ============================================

DO $$
DECLARE
    user_emails text[] := ARRAY[
        'haccorinti@naturgy.com.ar',
        'hernanacco@gmail.com',
        'hernanacco@kailu.travel',
        'herdaracco@gmail.com'
    ];
    target_email text;
    target_id uuid;
BEGIN
    FOREACH target_email IN ARRAY user_emails LOOP
        -- Obtener ID del usuario desde auth.users
        SELECT id INTO target_id FROM auth.users WHERE email = target_email LIMIT 1;
        
        IF target_id IS NOT NULL THEN
            -- 1. Eliminar pagos asociados a sus bookings
            DELETE FROM public.payments
            WHERE booking_id IN (SELECT id FROM public.bookings WHERE user_id = target_id);

            -- 2. Eliminar addons de sus bookings
            DELETE FROM public.booking_addons
            WHERE booking_id IN (SELECT id FROM public.bookings WHERE user_id = target_id);

            -- 3. Eliminar reviews
            DELETE FROM public.reviews WHERE user_id = target_id;

            -- 4. Eliminar bookings
            DELETE FROM public.bookings WHERE user_id = target_id;
            
            -- 5. Eliminar addons de sus trips
            DELETE FROM public.trip_addons
            WHERE trip_id IN (SELECT id FROM public.trips WHERE captain_id = target_id);

            -- 6. Eliminar fechas de sus trips
            DELETE FROM public.trip_dates
            WHERE trip_id IN (SELECT id FROM public.trips WHERE captain_id = target_id);

            -- 7. Eliminar trips (travesías)
            DELETE FROM public.trips WHERE captain_id = target_id;
            
            -- 8. Eliminar boats (embarcaciones)
            DELETE FROM public.boats WHERE owner_id = target_id;

            -- 9. Eliminar cupones creados por el usuario
            DELETE FROM public.coupons WHERE created_by = target_id;

            -- 10. Eliminar QR codes de hoteles del usuario
            DELETE FROM public.qr_codes
            WHERE hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = target_id);

            -- 11. Eliminar hoteles del usuario
            DELETE FROM public.hotels WHERE owner_id = target_id;

            -- 12. Eliminar el perfil público
            DELETE FROM public.profiles WHERE id = target_id;
            
            -- 11. Eliminar el usuario de auth.users (baja definitiva)
            DELETE FROM auth.users WHERE id = target_id;
            
            RAISE NOTICE '✅ Usuario eliminado: %', target_email;
        ELSE
            RAISE NOTICE '⚠️ No se encontró el usuario: %', target_email;
        END IF;
    END LOOP;
END $$;
