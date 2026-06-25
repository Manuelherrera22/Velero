-- ============================================
-- SCRIPT SEGURO DE BAJA DE USUARIOS
-- ⚠️ NO elimina trips, boats ni hoteles
-- Solo desactiva la cuenta y reasigna contenido
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
    -- ⬇️ CAMBIÁ ESTE ID POR EL UUID DEL ADMIN QUE SERÁ EL NUEVO DUEÑO DEL CONTENIDO
    admin_id uuid := '00000000-0000-0000-0000-000000000000';
    target_email text;
    target_id uuid;
BEGIN
    -- Primero verificamos que el admin existe
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_id AND role = 'admin') THEN
        RAISE EXCEPTION '❌ El admin_id proporcionado no existe o no tiene rol admin. Abortando.';
    END IF;

    FOREACH target_email IN ARRAY user_emails LOOP
        -- Obtener ID del usuario desde auth.users
        SELECT id INTO target_id FROM auth.users WHERE email = target_email LIMIT 1;

        IF target_id IS NOT NULL THEN
            -- 1. Reasignar trips al admin (NO se borran)
            UPDATE public.trips SET captain_id = admin_id WHERE captain_id = target_id;
            RAISE NOTICE '  → Trips reasignados al admin';

            -- 2. Reasignar boats al admin (NO se borran)
            UPDATE public.boats SET owner_id = admin_id WHERE owner_id = target_id;
            RAISE NOTICE '  → Boats reasignados al admin';

            -- 3. Reasignar hoteles al admin (NO se borran)
            UPDATE public.hotels SET owner_id = admin_id WHERE owner_id = target_id;
            RAISE NOTICE '  → Hoteles reasignados al admin';

            -- 4. Reasignar cupones al admin
            UPDATE public.coupons SET created_by = admin_id WHERE created_by = target_id;

            -- 5. Eliminar bookings del usuario (como pasajero, no como capitán)
            DELETE FROM public.payments
            WHERE booking_id IN (SELECT id FROM public.bookings WHERE user_id = target_id);
            DELETE FROM public.booking_addons
            WHERE booking_id IN (SELECT id FROM public.bookings WHERE user_id = target_id);
            DELETE FROM public.bookings WHERE user_id = target_id;

            -- 6. Eliminar reviews del usuario
            DELETE FROM public.reviews WHERE user_id = target_id;

            -- 7. Eliminar el perfil (ya no tiene FKs que cascadeen contenido)
            DELETE FROM public.profiles WHERE id = target_id;

            -- 8. Eliminar de auth.users (ya no puede loguearse)
            DELETE FROM auth.users WHERE id = target_id;

            RAISE NOTICE '✅ Usuario dado de baja: % (contenido preservado)', target_email;
        ELSE
            RAISE NOTICE '⚠️ No se encontró el usuario: %', target_email;
        END IF;
    END LOOP;
END $$;
