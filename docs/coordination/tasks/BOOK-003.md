# BOOK-003 — Confirmación y gestión de reserva

2026-09-03. DRAFT para ejecución después de correcciones AUTH-002. Requisitos reiterados por propietario; no iniciar simultáneamente en el mismo worktree.

## Verificación estática de base 2c43de1

BookingSection.tsx muestra código de reserva en la confirmación, pero no se encontró clave de gestión ni aviso de guardado/captura en esa vista. La referencia a guardarlo en selección de beneficios no es ese aviso. Las llamadas visibles de NotificationService desde server.ts son cancelaciones; no se encontró conexión del alta de reserva con email de confirmación. No se ha probado recepción de correo en este análisis y no se declara inexistente otro mecanismo sin completar el rastreo.

## Aceptación requerida

1. Confirmación visual: código de reserva + clave de gestión legibles y aviso “Guardá estos datos o tomá una captura: los vas a necesitar para gestionar o cancelar tu turno”, independientemente de tener email. Conservar diseño actual.
2. Con email: confirmación con servicio, profesional cuando corresponda, fecha DD/MM/YYYY, horario argentino y datos del turno, código y clave de gestión; enlace directo seguro al flujo de cancelación.
3. Enlace: autentica la gestión del turno sin exponer datos de otras personas. Mostrar servicio/fecha/hora y botón Confirmar cancelación; GET o previsualización de correo no cancela. No usar código público como único secreto. Respetar plazo configurado, manejo de expiración/reutilización y cancelación idempotente.
4. Entrega: notificación post-commit, fallos de email no deshacen reserva confirmada, registros/reintentos sin duplicados. No filtrar clave/token en APIs de listados, logs o informes. Revisar almacenamiento seguro compatible con entrega/reintentos antes de implementar.
5. Coordinar destino funcional con punto 12 del roadmap. Recuperación por email/código+clave y contacto al salón son etapas de ese punto; no publicar botón con enlace roto.
6. Sin email: conservar datos de gestión en pantalla y no prometer envío. Conservar restricciones de testing y allowlist; no enviar mensajes a terceros.
7. Pruebas UI y API aisladas; envío real solo a casilla propia autorizada; verificar enlace desde correo recibido y cancelación explícita sin efectos de abrirlo. Registrar commit desplegado para cierre.

Separar esta funcionalidad de códigos promocionales/descuentos. No activar WhatsApp automático.
