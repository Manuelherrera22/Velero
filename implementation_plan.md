# Mejora de Edición, Bloqueo de Plazas y Precio Privado

El objetivo de este plan es resolver los problemas reportados al publicar un viaje (precio de barco exclusivo no visible y fotos perdidas al editar) y añadir la nueva funcionalidad para gestionar "plazas bloqueadas" y proteger viajes que ya tienen ventas.

> [!IMPORTANT]
> **User Review Required**
> Necesito tu confirmación sobre el comportamiento de bloqueo al editar:
> Si un viaje **ya tiene reservas**, la propuesta es **bloquear todo** (título, precio, barco, servicios, etc.) para no cambiarle las reglas de juego a quien ya compró. **Sin embargo**, el Capitán sí podrá:
> 1. Añadir **nuevas fechas**.
> 2. Modificar las **plazas bloqueadas** de cualquier fecha.
> ¿Estás de acuerdo con permitir añadir fechas nuevas, o preferís que no se pueda tocar ABSOLUTAMENTE NADA de la travesía (salvo las plazas bloqueadas)?

## Proposed Changes

### Database Updates

#### [NEW] `supabase/migrations/007_blocked_spots.sql`
- Modificaremos la tabla `trip_dates` para añadir la columna `blocked_spots INT DEFAULT 0`.
- Esto permitirá llevar el registro exacto de cuántas plazas vendió el capitán por fuera de Kailu en cada fecha.

---

### Backend / Stores

#### [MODIFY] `src/stores/useTripWizardStore.js`
- Añadir la función `initForEdit(trip, dates)` que tome los datos de la base de datos y los inyecte correctamente en el formulario cuando el capitán entra a "Editar". Esto arreglará el problema de que las fotos y ciertos datos no cargaban.
- Añadir variable de estado `hasBookings` para saber si la travesía se debe bloquear.

#### [MODIFY] `src/stores/tripStore.js`
- Asegurar que al cargar una travesía para edición, verifique la cantidad de reservas activas (`bookings`) asociadas a esa travesía.

---

### Frontend Components

#### [MODIFY] `src/pages/TripDetail.jsx`
- Arreglar la lógica de `allow_full_boat`. Actualmente buscaba la variable en la raíz, pero el Wizard la guarda dentro de `metadata`. Esto arreglará que el botón de "Comprar velero exclusivo" aparezca correctamente habilitado.

#### [MODIFY] `src/pages/Dashboard/TripWizard/TripWizard.jsx`
- Añadir un `useEffect` que detecte si estamos editando (`isEditing`). Si es así, buscará la travesía real de la base de datos y la cargará usando el nuevo `initForEdit`.

#### [MODIFY] `src/pages/Dashboard/TripWizard/steps/Step9Dates.jsx`
- Añadir el campo de **"Plazas Bloqueadas"** por cada fecha agregada.
- Añadir la lógica para que el total disponible se calcule como: `Capacidad de la embarcación - Plazas Bloqueadas`.
- Si la travesía ya tiene ventas (`hasBookings` es true), bloquear la edición y eliminación de fechas pasadas/vendidas, permitiendo **únicamente** editar las "Plazas Bloqueadas".

#### [MODIFY] `src/pages/Dashboard/TripWizard/steps/Step10Finalize.jsx`
- Diferenciar entre modo Creación y modo Edición.
- Si `isEditing` es verdadero, ejecutar `.update()` en Supabase en lugar de `.insert()`, previniendo la duplicación de la travesía.
- Sincronizar (Actualizar/Insertar/Borrar) las fechas en `trip_dates` según los cambios que hizo el capitán en el Paso 9, guardando los nuevos valores de `blocked_spots`.

#### [MODIFY] (Resto de los Steps del Wizard: 1, 2, 3, 4, 5, 8)
- Añadir lógica `disabled={hasBookings}` a todos los inputs, checkboxes y subida de imágenes, para impedir cambios estructurales si ya hay pasajeros que compraron bajo las condiciones iniciales.

## Verification Plan

1. **Precio de velero:** Crear un viaje con precio de velero completo -> Ir a la página de detalle -> Verificar que la opción "Barco completo" aparece disponible.
2. **Edición:** Entrar a editar ese viaje -> Verificar que todos los datos (incluyendo fotos subidas previamente) aparecen cargados en el Wizard.
3. **Guardado en Edición:** Cambiar un dato en el Wizard -> Finalizar -> Verificar que no se creó un viaje duplicado, sino que se actualizó el existente.
4. **Plazas bloqueadas:** Añadir "2" plazas bloqueadas a una fecha -> Verificar que la disponibilidad real en la vista pública se reduce.
5. **Bloqueo por venta:** Simular una compra -> Intentar editar el viaje -> Verificar que los campos importantes aparecen bloqueados (grisados) y solo se pueden tocar las plazas bloqueadas.
