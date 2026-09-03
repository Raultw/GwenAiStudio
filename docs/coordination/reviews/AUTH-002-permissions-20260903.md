# Diagnóstico de permisos del ejecutor manual

2026-09-03. Propietario autorizó investigar y persistir permisos acotados para evitar confirmaciones repetidas.

Se guardaron reglas de lectura de revisión y regresión y lectura/escritura de archivos necesarios de AUTH-002 en settings.json global de Antigravity CLI. Se preservó configuración anterior, sin permitir todo, comandos genéricos, secretos ni datos. Se verificó JSON. Variante de ruta normalizada Windows probada únicamente para cinco destinos actuales, no otros worktrees.

Evidencia: una nueva sesión de lectura de db.ts respondió LECTURA_OK (64ae38c3-67e6-4eb2-9f57-bd396b868da3). La tarea completa luego volvió a denegar read_file sobre informe/script/server.ts, terminó CANCELED sin cambios (9644e1d0-2bdb-48c0-aafa-2c51f8eb8ca3). Persistir una regla no acredita que la herramienta la aplique consistentemente. No confundir con permisos de escritura Git o autorizaciones de Codex.

Referencias: https://antigravity.google/docs/cli/permissions y https://github.com/google-antigravity/antigravity-cli/issues/619 . El reporte Windows es indicio externo; no prueba causa local. Próximo diagnóstico: verificar versión y configuración efectiva del ejecutor antes de ampliar permisos o actualizarlo. No usar dangerously-skip-permissions. Automatización sigue PAUSADA; AUTH-002 continúa CHANGES_REQUESTED y ejecución del desarrollador bloqueada. Código sin nuevos cambios en estos intentos.
