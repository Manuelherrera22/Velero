# Cotización Detallada - Plataforma Kailu (Total Ajustado a $600.00 USD)

Esta propuesta técnica y económica detalla la estimación y el alcance para la implementación de los **17 puntos del backlog** para la plataforma Kailu. Todos los módulos y estimaciones han sido ajustados por complejidad para alcanzar un costo total de **$600.00 USD** (con una tarifa de **$5 USD por hora** para un total de **120 horas de desarrollo**).

---

## Resumen de la Cotización

| Módulo | Descripción | Horas Estimadas | Costo (USD)* |
| :--- | :--- | :---: | :---: |
| **Módulo A** | Sistema de Aliados y Comisión de Aliados (Kailu Allies) | 31 hs | $155.00 |
| **Módulo B** | Motor de Experiencias y Reservas (Finanzas y Disponibilidad) | 35 hs | $175.00 |
| **Módulo C** | Comunicación y Notificaciones Automatizadas (WhatsApp & Email) | 18 hs | $90.00 |
| **Módulo D** | Panel de Administración, Cupones y Gestión de Capitanes | 36 hs | $180.00 |
| **Total General** | **Implementación Completa del Backlog (17 Puntos)** | **120 hs** | **$600.00** |

> [!NOTE]
> \* *Los valores en dólares están calculados en base a una tarifa de **$5 USD por hora de desarrollo**, distribuidos por la complejidad real de cada tarea hasta alcanzar un presupuesto total de **$600.00 USD**.*
> Se incluye en cada módulo: análisis, desarrollo frontend/backend, pruebas de integración y soporte para el despliegue.

---

## Desglose Detallado por Módulo

### Módulo A: Sistema de Aliados y Comisión de Aliados (Kailu Allies)
Este módulo introduce el flujo completo para registrar aliados comerciales, vincular comisiones, generar códigos QR personalizados y gestionar porcentajes de comisión específicos para capitanes.

*   **Punto 1: Calcular distintos porcentajes de comisión para el capitán (Prioridad 3)**
    *   *Descripción:* Permitir que cada capitán tenga una comisión porcentual configurable en la base de datos (y editable por administradores) en lugar de un valor estático global.
    *   *Estimación:* **6 hs** ($30.00 USD)
*   **Punto 3: Panel Aliado Kailu 1 - Alta de aliado y vinculación de comisión (Prioridad 1)**
    *   *Descripción:* Resolver el flujo de registro. El administrador recibe la solicitud del aliado, le asigna su comisión y envía un enlace de registro único. Al registrarse, el aliado queda automáticamente vinculado.
    *   *Estimación:* **10 hs** ($50.00 USD)
*   **Punto 4: Panel Aliado Kailu 2 - Generar códigos QR (Prioridad 1)**
    *   *Descripción:* Permitir tanto al aliado en su panel como al administrador generar un código QR y enlace de referido (`?ref=aliado_id`) para experiencias específicas o la landing.
    *   *Estimación:* **7 hs** ($35.00 USD)
*   **Punto 5: Panel Aliado Kailu 3 - Generar sub-códigos internos/personalizados (Prioridad 1)**
    *   *Descripción:* El aliado puede generar múltiples sub-códigos específicos para identificar de dónde proviene la reserva (ej. "recepcion", "habitacion-101", "juan-perez") e integrarlos en el QR generado.
    *   *Estimación:* **8 hs** ($40.00 USD)

**Subtotal Módulo A: 31 horas ($155.00 USD)**

---

### Módulo B: Motor de Experiencias y Reservas (Finanzas y Disponibilidad)
Enfocado en flexibilizar las reservas, definir anticipos parciales, mejorar sustancialmente cómo el usuario ve los días libres, y ordenar las zonas geográficas.

*   **Punto 2: Calcular distintos porcentajes de anticipos en las experiencias (Prioridad 3)**
    *   *Descripción:* Permitir definir qué porcentaje del total se paga como seña/anticipo online en la plataforma (ej. 20%, 50%, 100%) y reflejar la diferencia a pagar a bordo en el checkout.
    *   *Estimación:* **7 hs** ($35.00 USD)
*   **Punto 9: Bloqueo de plazas en Velero Privado / Exclusivas (Prioridad 1)**
    *   *Descripción:* Si un cliente reserva la experiencia exclusiva (velero privado), la capacidad se bloquea automáticamente a 0 para ese slot y se impide al capitán bloquear plazas manuales que rompan la exclusividad.
    *   *Estimación:* **5 hs** ($25.00 USD)
*   **Punto 13: Vista de disponibilidad en formato Calendario en Ficha (Prioridad 2)**
    *   *Descripción:* Reemplazar la lista vertical de fechas en el detalle del trip por un calendario interactivo que resalte visualmente los días disponibles. Al tocar un día, se despliegan los horarios disponibles.
    *   *Estimación:* **12 hs** ($60.00 USD)
*   **Punto 16: Barra de desplazamiento / Indicativo visual en servicios incluidos (Prioridad 1)**
    *   *Descripción:* Agregar un indicador CSS (flecha o degradado de scroll) en el editor de experiencias para guiar al usuario a ver los servicios adicionales que están abajo y no se ven a primera vista.
    *   *Estimación:* **3 hs** ($15.00 USD)
*   **Punto 17: Incorporar Zonas de navegación configurables (Prioridad 2)**
    *   *Descripción:* Cargar las zonas iniciales (Río de la Plata y Litoral, Patagonia y Lagos Andinos, Brasil) de forma dinámica desde base de datos, permitiendo al administrador añadir nuevas zonas en el futuro.
    *   *Estimación:* **8 hs** ($40.00 USD)

**Subtotal Módulo B: 35 horas ($175.00 USD)**

---

### Módulo C: Comunicación y Notificaciones Automatizadas
Mejora las tasas de concreción de viajes y mantiene a todas las partes notificadas de forma oportuna.

*   **Punto 6: Confirmación por WhatsApp 48 hs antes (Prioridad 2)**
    *   *Descripción:* Integración con servicio API de WhatsApp para enviar un mensaje automático al capitán/organizador a las 48 hs previas al viaje. Si no confirma, se le da la opción de reprogramar al mismo día de la siguiente semana.
    *   *Estimación:* **12 hs** ($60.00 USD)
*   **Punto 14: Notificación de reservas al Capitán y Kailu (Prioridad 1)**
    *   *Descripción:* Enviar un correo instantáneo (vía Resend) al capitán cada vez que se realice una reserva en una de sus salidas, con detalles y contacto del cliente, notificando también al panel de administración.
    *   *Estimación:* **6 hs** ($30.00 USD)

**Subtotal Módulo C: 18 horas ($90.00 USD)**

---

### Módulo D: Panel de Administración, Cupones y Gestión de Capitanes
Mejoras para la operativa diaria del administrador, gestión de cupones antiguos y validación de seguridad de los capitanes.

*   **Punto 7: Reprogramación de experiencias y aviso de contacto (Prioridad 1)**
    *   *Descripción:* Bloquear la edición directa de un viaje si este ya cuenta con reservas. En su lugar, mostrar un modal informativo con un enlace directo a soporte (WhatsApp/Email) para solicitar la reprogramación.
    *   *Estimación:* **6 hs** ($30.00 USD)
*   **Punto 8: Alertas de mínimos de pasajeros no alcanzados 72 hs antes (Prioridad 2)**
    *   *Descripción:* Mostrar alertas en el panel de administrador cuando falten 72 hs para una salida y las reservas estén por debajo del mínimo configurado.
    *   *Estimación:* **6 hs** ($30.00 USD)
*   **Punto 10: Historial y visualización de Cupones Inactivos / Agotados (Prioridad 3)**
    *   *Descripción:* Ocultar cupones vencidos del panel principal de administración y moverlos a una sección colapsable ("Históricos") que detalle: código, descuento, vigencia y la relación `usados / creados` (ej. `3/10`).
    *   *Estimación:* **7 hs** ($35.00 USD)
*   **Punto 11: Buscador de experiencias por código de voucher en Admin (Prioridad 1)**
    *   *Descripción:* Añadir un campo de búsqueda en el panel del administrador para localizar inmediatamente la experiencia y reserva vinculadas a un código de voucher específico.
    *   *Estimación:* **5 hs** ($25.00 USD)
*   **Punto 12: Validación contra nombres de cupones duplicados (Prioridad 4)**
    *   *Descripción:* Validar del lado del servidor y cliente que no se pueda crear un cupón con un nombre que ya existe, mostrando un mensaje de advertencia claro en lugar de fallar silenciosamente.
    *   *Estimación:* **3 hs** ($15.00 USD)
*   **Punto 15: Verificación de Capitán con subida de Licencia Náutica (Prioridad 2)**
    *   *Descripción:* Cambiar el flujo de verificación manual en un clic. Ahora el capitán debe subir su licencia náutica (imagen/PDF) en su perfil, y el administrador puede revisarla visualmente antes de otorgar la verificación.
    *   *Estimación:* **9 hs** ($45.00 USD)

**Subtotal Módulo D: 36 horas ($180.00 USD)**

---

## Términos de la Propuesta y Próximos Pasos

1.  **Infraestructura de Terceros:**
    *   Para la mensajería de WhatsApp (Punto 6), se requiere contratar un proveedor API (ej. Twilio, Wasapi, Meta Cloud API). El costo del consumo de mensajes de WhatsApp corre por cuenta del cliente.
    *   Para el envío de correos (Punto 14), se utilizará la cuenta existente de Resend o la configurada para Kailu.
2.  **Cronograma Estimado:** En caso de realizar la aprobación total, el tiempo de entrega estimado es de **3 semanas** de desarrollo continuo en base a las 120 horas de trabajo contempladas.
