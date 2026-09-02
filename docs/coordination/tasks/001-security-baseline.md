# SEC-001 — Base de seguridad y plan de saneamiento

Estado: READY. Responsable: Antigravity. Revisor: ChatGPT/Codex.

## Objetivo

Preparar una entrega revisable que evite nuevas publicaciones accidentales de datos sensibles y defina cómo retirar la base operativa versionada sin romper el arranque ni modificar cuentas o datos existentes.

## Evidencia inicial a verificar

En el baseline local `055e5f6`, `data/gwen_db.json` está versionado y contiene campos no vacíos de contraseña, hash, salt y PIN legado, además de siete sesiones y cuatro eventos de auditoría. Estos son datos de la inspección, no valores para reproducir.

El `.gitignore` excluye `.env*` salvo `.env.example`, pero no la base JSON. Hay referencias a `pinAdmin` en código y tokens con apariencia de fixtures en tests. La presencia de una cadena no demuestra por sí sola uso activo ni autenticidad de una clave.

## Alcance aprobado sin nuevas consultas rutinarias

1. Trabajar en una rama independiente desde main; preservar la carpeta y datos operativos originales.
2. Revisar cómo se carga/inicializa la base JSON y qué sucede si falta. Identificar dependencias de arranque antes de proponer su retirada.
3. Completar `.gitignore` para base local, temporales, logs y configuración local, conservando `.env.example`. Aclarar que ignorar un archivo ya versionado no lo retira del índice ni del historial.
4. Preparar `data/gwen_db.example.json` solo si puede construirse como fixture genérico seguro: sin cuentas, contraseñas, PIN, hashes, sesiones, auditorías identificables ni contactos personales. No copiar esos valores desde la base real. Si el esquema exige datos sensibles, documentar el bloqueo en lugar de inventar una cuenta predeterminada.
5. Revisar `.env.example` y fixtures de pruebas sin publicar valores sospechosos. No sustituir secretos reales por credenciales por defecto.
6. Documentar los ajustes de arranque y pruebas que serían necesarios. Esta fase no modifica comportamiento funcional, autenticación, esquema SQL ni UI.
7. Entregar cambios documentales/de exclusión y el ejemplo seguro, cuando corresponda, junto con el plan de remediación en `docs/coordination/deliveries/SEC-001.md`.

## Acciones que deben quedar propuestas, no ejecutadas

- Retirar `data/gwen_db.json` del índice: quedó pendiente de autorización específica en la auditoría original. No borrarlo físicamente.
- Rotar contraseñas, revocar sesiones, editar secretos de Render o tocar Neon.
- Reescribir Git, borrar ramas/tags, limpiar commits históricos o hacer force-push.
- Implementar cambios funcionales para eliminar rutas o campos legados.

La entrega debe separar claramente estas decisiones de las tareas seguras ya completadas. No bloquear todo el trabajo por una autorización que solo afecta una etapa posterior.

## Pruebas y aceptación

- Identificar dependencias instaladas antes de ejecutar comandos. Inspeccionar scripts antes de correrlos: algunos escriben datos o envían correo.
- Validar sintaxis JSON del ejemplo y ausencia de valores sensibles en los archivos nuevos.
- Confirmar que `.env.example` sigue incluido y las reglas de exclusión cubren los archivos locales previstos.
- Verificar que `git diff` no contiene cambios de aplicación, secretos, datos eliminados ni cambios ajenos.
- Ejecutar `git diff --check`; TypeScript/build solo en entorno aislado con dependencias disponibles, indicando si no se ejecutan.
- No dar por saneado el repositorio histórico ni por revocadas las credenciales debido a este PR.
- Publicar rama/PR con commit exacto, pruebas, riesgos y siguientes acciones que requieren autorización. Pasar a REVIEW, no a DONE.

## Entrega mínima

Resumen de hallazgos sin valores sensibles; archivos modificados; evidencia y comandos realmente ejecutados; efecto esperado al faltar la base; pasos reversibles de saneamiento; bloqueos concretos; estado PR o PR PENDING si no existe acceso para crearlo.
