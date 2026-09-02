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

El propietario confirmó que el entorno completo contiene datos de testing y autorizó crear, modificar y limpiar registros de prueba para QA. Se habilitan operaciones acotadas por el panel/API en Render, identificadas y registradas, no borrados masivos ni cambios de infraestructura. No se requiere acceso directo a Neon para esta etapa. No enviar correo a terceros ni cambiar credenciales de acceso existentes. Credenciales del panel se proporcionarán en archivo privado fuera del repositorio; nunca copiarlas a informes, prompts o logs. Si falta acceso, continuar inspección y pruebas aisladas y declarar QA desplegado pendiente. Actualizar entrega, revisión, backlog y documento maestro al cerrar la etapa.
