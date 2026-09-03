# AUTH-002 — Bootstrap transaccional

Fecha 2026-09-03. Commit `18fac8d`. Alcance **APROBADO**, AUTH-002 continúa REVIEW.

El bootstrap PostgreSQL se ejecuta después de activar ese modo y liberar el cliente de inicialización. Usa un cliente dedicado para BEGIN, advisory lock compartido, conteo de cualquier superadmin, creación, auditoría y COMMIT/ROLLBACK/release. No crea una segunda cuenta ante un registro inactivo ni hace fallback a memoria tras fallo SQL.

Evidencia: 6 casos nuevos con SQL simulado; 72 casos AUTH-002 totales pasan, tsc y diff-check pasan. Sin PostgreSQL real, navegador, integración o Render.

Flujo Antigravity: la última ejecución sin terminal no pidió permisos, pero agotó tiempo y dejó un archivo truncado; se revirtió antes de publicar. En adelante usar al agente en plan/propuesta sin escritura, tareas pequeñas autocontenidas y sin terminal; Codex aplica con apply_patch, prueba y publica. El timeout no podrá dejar el worktree sucio.
