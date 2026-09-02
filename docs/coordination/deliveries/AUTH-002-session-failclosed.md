# AUTH-002 — Sesión ante fallo SQL

Revisión 2026-09-02 sobre e1b919a. validateSessionToken devolvía una sesión de memoria después de fallo SQL, aunque esa copia pudiera preceder a una revocación confirmada en PostgreSQL. Ahora rechaza la verificación en ese caso, sin error SQL crudo. La ruta puramente en memoria sigue funcionando y excluye también un atributo password heredado de la respuesta.

Codex aplicó el ajuste tras nueva respuesta vacía de Antigravity con read_file denegado sobre db.ts; no atribuir implementación al agente. No ampliar permisos sin diagnóstico adicional.

`node scripts/test_session_fail_closed.cjs`: cinco casos aislados aprobados: fallo SQL con copia de sesión válida en memoria, memoria válida sin campos sensibles, revocada, vencida y usuario inactivo. SQL simulado, sin DB/red. git diff --check aprobado. No acredita integración PostgreSQL ni cubre todos los fallbacks de autenticación; revisar getUserByUsername/getUserByEmail/createSession, self-change y competencia login/reset en siguientes bloques. Sin despliegue, roadmap 4 continúa abierto.
