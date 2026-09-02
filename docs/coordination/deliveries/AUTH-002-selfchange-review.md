# AUTH-002 — Cambio propio sobre operación transaccional

2026-09-02. Propuesta Antigravity 11a66158-d45a-4b39-a4c6-36442cdaa8b8, revisada/aplicada por Codex sobre 101cb4a. Un primer pedido falló por rutas inexistentes; segundo usó rutas absolutas correctas y respondió.

Se extrae changeUserCredentialAtomic privado de adminResetPassword. Nuevo wrapper changeOwnPassword valida entradas y fija identidad/modo del servidor. Verificación de contraseña actual/usuario activo ocurre bajo SELECT FOR UPDATE en PostgreSQL, y antes del snapshot en memoria. Cambio propio limpia mustChangePassword, reset administrativo lo activa. Ambos revocan sesiones existentes y auditan en la misma operación. Endpoint usa una llamada al wrapper en lugar de tres escrituras independientes.

Revisor eliminó rollback duplicado y aceptación de errores por substring arbitrario, y registro crudo del error en endpoint. No se acepta modo o userId desde body. Nunca se recortan contraseñas.

Pruebas ejecutadas: test_atomic_admin_reset.cjs, 17 escenarios SQL/fs simulados (incluye nueve de reset y ocho de cambio propio); test_password_change_context.cjs, 15 escenarios de contrato/delegación HTTP aislados. Los tests no importan servidor ni usan DB/disco/red reales. git diff --check aprobado. TypeScript global aún falla únicamente por node-fetch ausente en otra suite; no build completo.

No resuelve todavía creación de sesión concurrente con cambio/reset, rutas administrativas paralelas de updateUser ni fallback de búsqueda de usuarios. PostgreSQL real, filesystem real y QA desplegado pendientes. Roadmap 4 permanece en curso, no integrar automáticamente.
