# AUTH-002 — Validación contextual de contraseña

2026-09-02. Implementación focalizada del revisor sobre 645d9b0. Antigravity no produjo parche por read_file denegado; no atribuirle la implementación.

POST /api/auth/password-change rechaza valores no string/vacíos antes del hashing, contraseña nueva igual a actual y coincidencia case-insensitive con username normalizado. Mantiene clave original sin trim, política compartida y flujo de persistencia/revocación/auditoría.

`node scripts/test_password_change_context.cjs`: 17 casos aislados aprobados, con handler extraído y dependencias simuladas. Cubre tipos incorrectos, actual errónea, reutilización, username, caso válido y fallo de persistencia sin éxito ni revocación posterior. No importa server.ts, no inicia DB ni red ni utiliza credenciales. No acredita concurrencia ni integración SQL.

Persisten pendientes transaccionalidad conjunta, provisión/reset y Mi cuenta. No desplegado. Diagnóstico adicional del CLI bloqueado por revisión automática: considera necesaria autorización específica para enviar código privado a Antigravity; no insistir sin resolución del propietario.
