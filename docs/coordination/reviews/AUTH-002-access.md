# AUTH-002 — Acceso recuperado

2026-09-02. Propietario autorizó crear su cuenta y desactivar las otras administrativas preservando historial.

Una transacción PostgreSQL creó una cuenta superadmin, desactivó 17 cuentas administrativas activas, revocó cinco sesiones y registró eventos de auditoría. La validación antes de commit confirmó una sola cuenta administrativa activa. No se modificaron profesionales ni se borraron usuarios físicamente. No publicar identificadores privados, emails ni secretos en Git.

Prueba HTTP real en Render: login 200, rol superadmin, mustChangePassword=false (contraseña elegida por propietario), auth/me 200, benefit-templates 200, segunda auth/me 200, logout 200. Sesión de prueba cerrada. No equivale a QA de navegador, recarga o creación de beneficios.

Los seis usernames superadmin anteriormente activos coinciden con fixtures del archivo scripts/test_auth_suite.ts (líneas 58, 127, 313, 374, 383 y 405 del baseline). No se encontraron eventos de auditoría asociados a esas seis cuentas antes de esta operación. Origen de pruebas probable; ejecutor y mecanismo de llegada a Neon no acreditados. Revisar aislamiento antes de correr suites. Listado completo entregado privadamente al propietario, no versionado.
