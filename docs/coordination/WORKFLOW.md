# Protocolo de coordinación

## 1. Canal y puesta en marcha

GitHub contiene instrucciones, entregas y revisiones; no es un ejecutor de agentes. Antigravity informó que necesita una sesión iniciada por el usuario. No hay un servicio desatendido verificado. No afirmar que los agentes se comunican o ejecutan automáticamente fuera de esas sesiones.

Esta documentación se publica inicialmente en `codex/coordination-workflow`, sin integrar main. Durante esta puesta en marcha, leer las instrucciones de esa rama. Las implementaciones parten del main canónico, sin arrastrar la rama documental. Después de integrar la documentación aprobada, main será también la fuente del protocolo.

Inicio de una sesión:

1. Verificar que origin sea `https://github.com/Raultw/GwenAiStudio.git`.
2. Consultar cambios del remoto mediante fetch, sin reset ni sobrescribir cambios locales.
3. Leer backlog y revisiones de tareas asignadas.
4. Ejecutar trabajo READY o CHANGES_REQUESTED dentro del alcance autorizado.
5. Publicar resultados en la rama de trabajo. Continuar con otro trabajo autorizado si existe.

Dentro de una sesión activa se puede consultar nuevamente GitHub al terminar una etapa. Si existe un mecanismo de espera/temporizador soportado, documentarlo y verificarlo antes de usarlo. No simular vigilancia permanente ni mantener bucles de consultas intensivas. Sin trabajo accionable, declarar IDLE; si la sesión termina, será necesario iniciarla nuevamente.

## 2. Estados y propiedad

- DRAFT: propuesta, no implementar.
- READY: alcance aprobado; el agente asignado puede comenzar.
- IN_PROGRESS: el desarrollador publicó la rama y registró el inicio.
- REVIEW: entrega lista para revisar, no aprobada todavía.
- CHANGES_REQUESTED: correcciones concretas del revisor, dentro del alcance.
- BLOCKED: falta un dato, permiso o dependencia. Documentar la acción mínima necesaria y continuar trabajo independiente.
- DONE: revisión aprobada; registrar commit integrado y QA ejecutado/pendiente.

El arquitecto mantiene el backlog central. El desarrollador registra estado y evidencia en `docs/coordination/deliveries/<ID>.md` dentro de su rama. No competir editando el backlog en varias ramas.

El revisor registra observaciones en el PR. Como alternativa sin API de PR, publica `docs/coordination/reviews/<ID>.md` en una rama de revisión, indicando el commit revisado y los hallazgos. El desarrollador consulta esa rama, responde en su entrega y publica nuevos commits. No se necesita que el propietario copie los informes entre agentes una vez iniciado el ciclo.

## 3. Ramas y entrega

- Rama de implementación sugerida: `antigravity/<ID>-descripcion`.
- Ramas del revisor: `codex/<ID>-review` o `codex/<descripcion>`.
- Crear worktree/clon independiente; no cambiar la rama de la carpeta usada por otro agente.
- Antes de cada push comprobar remoto, rama y diff. Usar push normal, nunca forzado como rutina.
- Publicar un PR hacia main cuando haya acceso. Si no lo hay, publicar rama e informe y registrar PR PENDING.
- La entrega incluye objetivo, archivos modificados, commit, pruebas/comandos/exit codes, pendientes, efectos sobre datos/red y riesgos.
- No integrar main sin revisión aprobada. No fusionar automáticamente solo por tests verdes.

## 4. QA y despliegue

Entorno desplegado: https://gwenaistudio.onrender.com/.

La conexión a Neon no autoriza pruebas contra esa base. Usar una base separada y datos ficticios; si no existe aislamiento verificable, marcar esas pruebas pendientes.

El despliegue automático por integración aprobada está autorizado. Distinguir:

1. Push confirmado por GitHub.
2. Despliegue iniciado.
3. Despliegue exitoso del commit esperado.
4. QA funcional ejecutado en la versión desplegada.

Una respuesta HTTP 200 por sí sola no acredita el commit desplegado. Probar login, carga de módulos y navegación sin mutaciones primero. Reservas, cancelaciones, correos reales y acciones sensibles requieren autorización específica y datos de prueba identificados.

## 5. Evitar consultas innecesarias al propietario

Resolver decisiones técnicas rutinarias dentro de cada tarea y registrar el razonamiento. Pedir intervención solo cuando sea necesaria por permisos sensibles, alcance ambiguo, acceso faltante o una decisión de negocio no definida. No pedir al propietario que retransmita material ya publicado y accesible en Git.
