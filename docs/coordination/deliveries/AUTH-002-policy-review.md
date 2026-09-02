# AUTH-002: política compartida y recuperación de coordinación

Estado: REVIEW parcial. Fecha: 2026-09-02.

El propietario confirmó la configuración específica de safe.directory y del permiso de lectura de Antigravity. Git funciona; el índice del worktree requiere ejecución autorizada fuera del sandbox porque reside en la carpeta original del proyecto.

Checkpoint inicial: 903ff64. Antigravity recibió AUTH-002 REVISION-2 sobre ese commit, finalizó con exit 0 y respuesta no vacía, y creó src/utils/passwordPolicy.ts. db.ts utiliza el validador compartido. La ejecución terminó a las 16:13 UTC.

Política: 8–16 caracteres, mayúscula, minúscula, número y símbolo distinto de espacios. Rechaza cuatro dígitos consecutivos ascendentes o descendentes, sin considerar 7890 una secuencia continua. No cambia la verificación de hashes existentes. El módulo expone las condiciones para la futura lista visual.

QA del revisor: 12 casos ejecutados con Node 24 sobre el módulo puro, todos aprobados; incluyen longitudes 7/8/16/17, clases de caracteres, espacio como falso símbolo, secuencias ascendentes/descendentes y concordancia entre checklist y validador. No se importó db.ts ni se usaron datos o red en estas pruebas. git diff --check aprobado.

TypeScript global: pendiente, falla por TS2307 en scripts/test_booking_concurrency.ts:1 (node-fetch ausente), ya conocido. No se afirma build ni QA de navegador de este cambio.

Pendiente AUTH-002: conectar checklist visual verde al formulario, pruebas completas del cambio de contraseña y flujos de cuentas/clave temporal. Esta entrega no cierra AUTH-002 ni autoriza integración automática.

El lanzador local ahora clasifica SUCCESS con respuesta vacía como NO_OUTPUT_REQUIRES_REVIEW y no evita reintentos solo por un recibo fallido. Publicar una rama no implica despliegue.
