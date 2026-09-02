# AUTH-002: persistencia de credenciales

2026-09-02, revisión parcial sobre ee562e3. Codex implementó corrección focalizada tras rechazo read_file del CLI de Antigravity; recibo NO_OUTPUT_REQUIRES_REVIEW. No se considera entrega del desarrollador ni se repite pedido automáticamente.

Hallazgos y cambios: updateUser expandía el campo password recibido en memoryDb antes de guardar JSON. Ahora excluye password entrante y cualquier atributo password previo en el registro actualizado. Conserva hash/salt. createUser ya no utiliza clave fallback hardcodeada y exige contraseña explícita válida. Si PostgreSQL rechaza crear/actualizar, lanza error genérico y no continúa escribiendo memoria como si hubiera tenido éxito; evita registrar detalles SQL con parámetros sensibles.

Verificación reproducible: `node scripts/test_user_credential_persistence.cjs` — 8 casos aprobados. Extrae createUser/updateUser con parser TypeScript y las ejecuta con persistencia/hash simulados. Cubre datos ausentes/invalidos, creación sin password persistido, actualización y limpieza del atributo previo, y fallos INSERT/UPDATE sin mutación local. No importa db.ts ni abre DB/red/archivos de datos. No equivale a integración PostgreSQL real ni prueba de concurrencia.

`git diff --check` aprobado. TypeScript global: únicamente error conocido TS2307, node-fetch ausente en test_booking_concurrency.ts. Provisión genérica configurable todavía pendiente: no se introdujo nuevo secreto. No se modificaron cuentas operativas ni datos existentes de forma masiva. No integrado/desplegado.
