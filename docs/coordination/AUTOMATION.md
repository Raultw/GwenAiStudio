# Coordinación automática — configuración operativa

Actualización: 2026-09-02. Reemplaza la limitación inicial de solo coordinación manual por sesión. No elimina los límites de seguridad de AGENTS.md ni autoriza nuevas funcionalidades.

## Mecanismo configurado

- Seguimiento del producto ligado a la conversación actual, cada diez minutos. Identificador: `coordinaci-n-gwen-nails-y-antigravity`.
- Codex consulta entregas nuevas en Git, revisa cambios y despacha correcciones autorizadas mediante Antigravity CLI (`agy --print`).
- Una respuesta mínima y una lectura real de SEC-001 fueron verificadas con la autenticación local existente.
- El CLI no depende de reabrir el chat manual del IDE: cada ejecución recibe instrucciones concretas y rutas de la tarea. El repositorio conserva entregas y revisiones.
- El estado local del coordinador, runner y recibos está en `coordination-control/` del workspace de esta conversación, fuera del repositorio de aplicación. No contiene claves ni cambia la app.

## Separación de carpetas y permisos

- La sesión manual conserva `antigravity/SEC-001-security-baseline`.
- Las ejecuciones automáticas usan otro worktree: `sec001-agent`, rama `antigravity/SEC-001-automated`.
- El revisor usa `sec001-review`, rama `codex/SEC-001-review`.
- Antigravity tiene reglas explícitas para leer los documentos de coordinación y editar solo .gitignore, data/gwen_db.example.json y docs/coordination/deliveries/SEC-001.md en su worktree automatizado.
- No se concedieron reglas de terminal, Git, acceso general a archivos ni bypass de permisos. La invocación mantiene sandbox. Los defaults del propio producto también aplican; estas reglas no equivalen por sí solas a una jaula de sistema operativo.
- Codex valida el diff y ejecuta los commits/push normales de las ramas autorizadas. Nunca se publica automáticamente solo porque el agente devolvió SUCCESS.

## Duplicados, fallos y límites

El runner mantiene un bloqueo exclusivo durante la invocación y un recibo por hash de instrucciones. Repetir un pedido ya procesado produce SKIP sin invocar al modelo. Los recibos fallidos o RUNNING requieren inspección, no reintento ciego. Se permiten como máximo dos rondas de corrección por ciclo.

El estado conserva commit revisado, ramas y tarea. Sin una entrega nueva o tarea aprobada, no se invoca Antigravity. Al terminar SEC-001 se espera el roadmap del propietario, sin comenzar tareas DRAFT.

No se integra main, se hacen force-push, se borran datos, se cambian credenciales ni se ejecutan migraciones o correos reales. El saneamiento del historial, la desindexación de la base y la rotación continúan pendientes de autorización específica.

## Disponibilidad y evidencia

El seguimiento local necesita computadora encendida, aplicación activa, autenticación y permisos de red/archivos. Usa las cuotas normales de los agentes. Si el host está apagado o un permiso impide el trabajo desatendido, no hay garantía de ejecución.

La creación de la tarea periódica fue confirmada por la herramienta del producto. La ejecución directa del ciclo se verifica por separado en la revisión SEC-001. El primer disparo causado por el programador, no por una ejecución manual del runner, debe registrarse cuando ocurra: no inferirlo de que la automatización figure ACTIVE.

## Próximas tareas

El propietario define objetivos y prioridades una vez. El arquitecto los convierte en tareas aprobadas con archivos permitidos, pruebas de aceptación y límites. El coordinador despacha y revisa sin exigir que el propietario copie mensajes entre agentes. Las nuevas tareas requieren su propio alcance y permisos mínimos; no reutilizar por defecto acceso irrestricto a toda la aplicación.
