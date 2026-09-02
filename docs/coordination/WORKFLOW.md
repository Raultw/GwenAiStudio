# Protocolo de coordinaci├│n

## 1. Canal y puesta en marcha

GitHub contiene instrucciones, entregas y revisiones; no es un ejecutor de agentes. La limitaci├│n inicial del IDE fue complementada con Antigravity CLI y un seguimiento peri├│dico ligado al chat de Codex. Consultar [AUTOMATION.md](AUTOMATION.md) para la configuraci├│n verificada y sus l├¡mites. No confundir una ejecuci├│n directa del CLI con un disparo ya observado del programador.

Esta documentaci├│n se publica inicialmente en `codex/coordination-workflow`, sin integrar main. Durante esta puesta en marcha, leer las instrucciones de esa rama. Las implementaciones parten del main can├│nico, sin arrastrar la rama documental. Despu├⌐s de integrar la documentaci├│n aprobada, main ser├í tambi├⌐n la fuente del protocolo.

Inicio de una sesi├│n:

1. Verificar que origin sea `https://github.com/Raultw/GwenAiStudio.git`.
2. Consultar cambios del remoto mediante fetch, sin reset ni sobrescribir cambios locales.
3. Leer backlog y revisiones de tareas asignadas.
4. Ejecutar trabajo READY o CHANGES_REQUESTED dentro del alcance autorizado.
5. Publicar resultados en la rama de trabajo. Continuar con otro trabajo autorizado si existe.

Dentro de una sesi├│n activa se puede consultar nuevamente GitHub al terminar una etapa. Si existe un mecanismo de espera/temporizador soportado, documentarlo y verificarlo antes de usarlo. No simular vigilancia permanente ni mantener bucles de consultas intensivas. Sin trabajo accionable, declarar IDLE; si la sesi├│n termina, ser├í necesario iniciarla nuevamente.

## 2. Estados y propiedad

- DRAFT: propuesta, no implementar.
- READY: alcance aprobado; el agente asignado puede comenzar.
- IN_PROGRESS: el desarrollador public├│ la rama y registr├│ el inicio.
- REVIEW: entrega lista para revisar, no aprobada todav├¡a.
- CHANGES_REQUESTED: correcciones concretas del revisor, dentro del alcance.
- BLOCKED: falta un dato, permiso o dependencia. Documentar la acci├│n m├¡nima necesaria y continuar trabajo independiente.
- DONE: revisi├│n aprobada; registrar commit integrado y QA ejecutado/pendiente.

El arquitecto mantiene el backlog central. El desarrollador registra estado y evidencia en `docs/coordination/deliveries/<ID>.md` dentro de su rama. No competir editando el backlog en varias ramas.

El revisor registra observaciones en el PR. Como alternativa sin API de PR, publica `docs/coordination/reviews/<ID>.md` en una rama de revisi├│n, indicando el commit revisado y los hallazgos. El desarrollador consulta esa rama, responde en su entrega y publica nuevos commits. No se necesita que el propietario copie los informes entre agentes una vez iniciado el ciclo.

## 3. Ramas y entrega

- Rama de implementaci├│n sugerida: `antigravity/<ID>-descripcion`.
- Ramas del revisor: `codex/<ID>-review` o `codex/<descripcion>`.
- Crear worktree/clon independiente; no cambiar la rama de la carpeta usada por otro agente.
- Antes de cada push comprobar remoto, rama y diff. Usar push normal, nunca forzado como rutina.
- Publicar un PR hacia main cuando haya acceso. Si no lo hay, publicar rama e informe y registrar PR PENDING.
- La entrega incluye objetivo, archivos modificados, commit, pruebas/comandos/exit codes, pendientes, efectos sobre datos/red y riesgos.
- No integrar main sin revisi├│n aprobada. No fusionar autom├íticamente solo por tests verdes.

## 4. QA y despliegue

Entorno desplegado: https://gwenaistudio.onrender.com/.

La conexi├│n a Neon no autoriza pruebas contra esa base. Usar una base separada y datos ficticios; si no existe aislamiento verificable, marcar esas pruebas pendientes.

El despliegue autom├ítico por integraci├│n aprobada est├í autorizado. Distinguir:

1. Push confirmado por GitHub.
2. Despliegue iniciado.
3. Despliegue exitoso del commit esperado.
4. QA funcional ejecutado en la versi├│n desplegada.

Una respuesta HTTP 200 por s├¡ sola no acredita el commit desplegado. Probar login, carga de m├│dulos y navegaci├│n sin mutaciones primero. Reservas, cancelaciones, correos reales y acciones sensibles requieren autorizaci├│n espec├¡fica y datos de prueba identificados.

## 5. Evitar consultas innecesarias al propietario

Resolver decisiones t├⌐cnicas rutinarias dentro de cada tarea y registrar el razonamiento. Pedir intervenci├│n solo cuando sea necesaria por permisos sensibles, alcance ambiguo, acceso faltante o una decisi├│n de negocio no definida. No pedir al propietario que retransmita material ya publicado y accesible en Git.
