-- ============================================
-- SCRIPT DE LIMPIEZA DE USUARIOS DE PRUEBA
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Variables para mayor claridad (puedes ejecutar todo el bloque junto)
DO $$
DECLARE
    user_emails text[] := ARRAY[
        'haccorinti@naturgy.com.ar',
        'herdaracco@gmail.com',
        'hernanacco@gmail.com'
    ];
    target_email text;
    target_id uuid;
BEGIN
    FOREACH target_email IN ARRAY user_emails LOOP
        -- Obtener ID del usuario
        SELECT id INTO target_id FROM auth.users WHERE email = target_email LIMIT 1;
        
        IF target_id IS NOT NULL THEN
            -- Eliminar de bookings (si tiene reservas, esto limpia todo en cascada)
            DELETE FROM public.bookings WHERE user_id = target_id;
            
            -- Eliminar de trips (si tiene travesías)
            -- Nota: borrar travesías borrará trip_dates en cascada
            DELETE FROM public.trips WHERE captain_id = target_id;
            
            -- Eliminar de hotels
            DELETE FROM public.hotels WHERE owner_id = target_id;
            
            -- Eliminar el perfil público
            DELETE FROM public.profiles WHERE id = target_id;
            
            -- Eliminar el usuario de la autenticación base (auth.users)
            DELETE FROM auth.users WHERE id = target_id;
            
            RAISE NOTICE 'Usuario eliminado con éxito: %', target_email;
        ELSE
            RAISE NOTICE 'No se encontró el usuario: %', target_email;
        END IF;
    END LOOP;
END $$;
