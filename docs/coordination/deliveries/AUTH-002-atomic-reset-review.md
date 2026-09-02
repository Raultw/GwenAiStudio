# AUTH-002 — Reset administrativo transaccional

2026-09-02. REVIEW parcial sobre base 6df6715. Propuesta recibida de Antigravity (conversación 6561b556-f14c-44da-a769-f5dc20113f6b), revisada y aplicada por Codex.

adminResetPassword usa una conexión SQL: BEGIN, SELECT usuario FOR UPDATE, cambio hash/salt y obligación de cambiar contraseña, revocación de sesiones existentes, auditoría, COMMIT y release. Si falla, rollback y error genérico; sin fallback a memoria. Construcción de respuesta segura antes de COMMIT para no fallar por transformación después de confirmar.

Memoria prepara snapshot sin mutar estado, guarda temporal exclusivo con permisos restrictivos, cierra descriptor y renombra antes de publicar arrays. Ante fallo no publica snapshot; elimina solo temporal creado por esta operación. Sin awaits en ruta memoria. No modifica roles ni usuario activo/inactivo. No devuelve hash/salt/atributo password.

`node scripts/test_atomic_admin_reset.cjs`: 9 escenarios aprobados con SQL/fs simulados: éxito memoria, fallos escritura/rename, usuario inexistente en ambos almacenamientos, éxito SQL y fallos update usuario/sesiones/auditoría. Verifica orden, rollback, release, revocación, ausencia de clave plana y no mutación ante fallos. No se ejecutó PostgreSQL real, disco real ni reset de cuenta operativa. No afirmar garantía concurrente del motor a partir de mocks.

git diff --check aprobado. TypeScript global continúa con TS2307 de node-fetch ausente en test_booking_concurrency.ts, sin nuevos diagnósticos observados. Pendientes self-change transaccional, competencia login/reset, rutas alternativas de actualización, pruebas SQL aisladas y QA desplegado. Roadmap ítem 4 permanece en curso.
