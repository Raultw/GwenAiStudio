# AUTH-002 — Sesión y administración de tipos de beneficio

Estado READY. Autorización: propietario retomó expresamente este plan el 2026-09-02.

Inspeccionar primero el baseline canónico y preparar worktree aislado. No utilizar el runner SEC-001 para esta tarea: sus permisos se limitan a tres archivos documentales. Preparar un pedido y permisos acotados propios tras localizar los archivos involucrados.

## Alcance

- Reproducir pérdida de sesión al recargar y revisar restauración del frontend/cookies/backend sin debilitar seguridad.
- Reconocer superadmin como autorizado para el catálogo, manteniendo denegación a roles no habilitados.
- Verificar listado vacío frente a errores 401, 403, red y servidor; corregir mensajes sin encubrir fallos.
- Crear/editar plantillas con sesión válida y validación autoritativa, sin cambiar descuentos ni reglas del catálogo.
- Conservar estética, UX y funcionalidades no relacionadas.

## Evidencia requerida

Login, recarga, navegación y logout; sesión ausente/expirada; matriz superadmin/admin/professional; listado vacío; creación válida/inválida. Distinguir tests de memoria, PostgreSQL aislado y navegador real. No declarar producción verificada por mocks o HTTP 200.

No usar Neon operativo para fixtures ni enviar correo. No cambiar credenciales reales, cuentas o permisos del entorno desplegado. Si falta acceso, continuar inspección y pruebas aisladas y declarar QA desplegado pendiente. Actualizar entrega, revisión, backlog y documento maestro al cerrar la etapa.
