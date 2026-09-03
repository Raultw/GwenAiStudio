# Gwen Nails ΓÇö Contexto y Arquitectura del Proyecto

## 1. Identidad
**Repositorio de referencia:** https://github.com/Raultw/GwenAiStudioBeta

Gwen Nails es una plataforma full-stack de gesti├│n y reservas online para estudios de belleza, manicura y bienestar, preparada para evolucionar hacia m├║ltiples profesionales y, potencialmente, m├║ltiples negocios.

## 2. Stack
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts/D3.
- Backend: Node.js, Express, TypeScript, esbuild, REST/JSON.
- Persistencia: PostgreSQL, `pg`, Drizzle/SQL; JSON local ├║nicamente como soporte de desarrollo.

## 3. Arquitectura
```text
Frontend React
      Γöé REST/JSON
      Γû╝
Backend Express
      Γö£ΓöÇΓöÇ Gesti├│n / Administraci├│n
      Γö£ΓöÇΓöÇ CRM
      Γö£ΓöÇΓöÇ Reservas
      Γö£ΓöÇΓöÇ Profesionales
      Γö£ΓöÇΓöÇ Servicios
      ΓööΓöÇΓöÇ Horarios
              Γöé
              Γû╝
      Motor de Disponibilidad
              Γöé
              Γû╝
          PostgreSQL
```

`availabilityEngine.ts` es la fuente de verdad para calcular disponibilidad. No duplicar sus reglas innecesariamente en frontend ni en endpoints.

## 4. Disponibilidad
La disponibilidad cruza:
1. horario del local;
2. horario del profesional;
3. excepciones de disponibilidad;
4. servicio;
5. duraci├│n;
6. buffer;
7. turnos existentes;
8. profesional seleccionado o profesionales capaces de realizar el servicio.

Conceptualmente:
```text
Horario local Γê⌐ Horario profesional
+ servicio/duraci├│n/buffer
ΓêÆ reservas/bloqueos/excepciones aplicables
ΓåÆ slots disponibles
```

Si el cliente no elige profesional, se consideran los profesionales habilitados para el servicio. Si lo elige, solo se considera ese profesional y se valida su aptitud para el servicio.

## 5. Profesionales y servicios
- Un profesional puede realizar m├║ltiples servicios.
- Un servicio puede ser realizado por m├║ltiples profesionales.
- El cliente puede elegir profesional o dejar que el sistema determine disponibilidad.
- El backend siempre debe validar la relaci├│n profesional-servicio.

## 6. Estados de turnos
Solo existen:
- **Pendiente**
- **Completado**
- **Cancelado**

No reintroducir **Confirmado**. Los turnos cancelados no bloquean disponibilidad.

## 7. Horarios
El horario del local y el de cada profesional est├ín relacionados, pero son configuraciones independientes.

El local puede tener horarios diferentes por d├¡a, horario corrido o cortado, d├¡as cerrados y m├║ltiples intervalos.

Los profesionales pueden trabajar jornadas m├ís acotadas.

La disponibilidad efectiva debe respetar la cobertura del local salvo extensi├│n expl├¡cita.

## 8. Vigencia
Los cambios de horario semanal se versionan mediante vigencia. No alterar retrospectivamente horarios hist├│ricos ni crear sistemas paralelos al mecanismo existente.

## 9. Excepciones de disponibilidad
Usar siempre el t├⌐rmino **Excepci├│n de disponibilidad**, no ΓÇ£Excepci├│n de horarioΓÇ¥.

Sirven para modificar la disponibilidad de una fecha puntual sin afectar fechas futuras.

Ejemplo:
```text
S├íbado habitual: 09:00ΓÇô17:00
Excepci├│n 29/08: 09:00ΓÇô20:00
```

La selecci├│n de profesionales debe admitir m├║ltiples profesionales. La BD puede conservar registros independientes por profesional; no es necesario almacenar arrays de IDs en una fila. La creaci├│n m├║ltiple debe ser transaccional.

## 10. Cobertura local/profesional
Si un horario profesional supera el horario del local, advertir al administrador.

- En un cambio semanal, una extensi├│n aceptada debe respetar la vigencia correspondiente.
- En una excepci├│n puntual, una extensi├│n aceptada debe afectar ├║nicamente esa fecha mediante una excepci├│n del local.
- Nunca convertir accidentalmente una excepci├│n puntual en un cambio semanal permanente.

## 11. Excepci├│n vs bloqueo
**Excepci├│n de disponibilidad:** modifica la disponibilidad habitual.
**Bloqueo:** impide reservar un tramo que normalmente estar├¡a disponible.

Ejemplo de bloqueo: 14:00ΓÇô15:00 dentro de una jornada 09:00ΓÇô17:00.

Mantener ambas responsabilidades claramente diferenciadas.

## 12. Agenda y detalle de turno
La Agenda permite visualizar turnos, estados, completarlos y acceder a su detalle.

El detalle del turno debe priorizar el contexto del turno actual sin duplicar innecesariamente la ficha completa de la clienta.

Las secciones:
- Alertas y antecedentes
- Preferencias & estilo
- Tips y Softgel

se muestran como solo lectura en este contexto, colapsables. **Alertas y antecedentes** queda desplegada por defecto; las otras dos, colapsadas. La edici├│n contin├║a en la ficha de la clienta.

## 13. Turno anterior
Debe ser el ├║ltimo turno anterior **marcado como Completado/Finalizado**, no simplemente el ├║ltimo creado.

Mostrar:
- fecha;
- hora;
- servicio;
- anotaciones del cliente sobre el trabajo a realizar.

Si no existen anotaciones: **ΓÇ£No inform├│ detallesΓÇ¥**.

Nunca confundir el turno actual con el anterior.

## 14. CRM
La ficha de clienta puede contener tel├⌐fono, email, historial, cantidad de servicios, gasto acumulado, turno anterior, alertas/antecedentes, preferencias/estilo, tips/Softgel y notas administrativas.

## 15. M├⌐tricas
El sistema ofrece visi├│n general de demanda, servicios, valores econ├│micos, evoluci├│n, proyecciones y comportamiento de clientas. No asumir que reemplaza un sistema contable completo.

## 16. Seguridad
- Toda operaci├│n administrativa se valida en backend.
- No confiar en permisos enviados desde React.
- Validar IDs, fechas, horarios, estados y relaciones.
- Usar transacciones cuando una operaci├│n modifique m├║ltiples registros.
- No mantener credenciales hardcodeadas/backdoors.
- PostgreSQL es la fuente de verdad en producci├│n.

En producci├│n:
```text
DATABASE_URL obligatoria
ΓåÆ PostgreSQL
ΓåÆ sin fallback silencioso a JSON
```
Una ca├¡da de PostgreSQL debe producir un error controlado.

## 17. Concurrencia
`validateBookingSlot()` es una validaci├│n de negocio, no la ├║nica garant├¡a. La creaci├│n de turnos debe contar con protecci├│n transaccional/relacional adecuada para impedir reservas incompatibles concurrentes. La segunda solicitud debe recibir un error controlado y amigable.

## 18. Filosof├¡a de evoluci├│n
1. Inspeccionar primero el c├│digo existente.
2. Reutilizar arquitectura y funciones existentes.
3. Evitar sistemas paralelos.
4. Modificar ├║nicamente lo estrictamente necesario.
5. Mantener est├⌐tica y UX actuales.
6. No cambiar nombres, endpoints, componentes o comportamientos no relacionados.
7. Mantener compatibilidad con datos existentes.
8. Priorizar integridad y seguridad.
9. Centralizar disponibilidad en `availabilityEngine.ts`.
10. Implementar cambios en etapas peque├▒as y verificables.

## 19. Roadmap
### Fase 0 ΓÇö Seguridad y robustez
- credenciales/backdoors;
- endpoints administrativos;
- concurrencia;
- producci├│n/dev;
- cobertura.

### Fase 1 ΓÇö Excepciones de disponibilidad
- UI;
- selecci├│n m├║ltiple de profesionales;
- creaci├│n transaccional;
- excepciones local/profesional;
- tipos necesarios.

### Fase 2 ΓÇö Extensi├│n puntual del local
- advertencia;
- confirmaci├│n;
- extensi├│n semanal seg├║n contexto;
- extensi├│n puntual mediante excepci├│n.

### Fase 3 ΓÇö Gesti├│n completa de horarios
- local;
- profesionales;
- vigencias;
- m├║ltiples intervalos;
- excepciones;
- bloqueos;
- UX unificada.

### Fase 4 ΓÇö Experiencia p├║blica multi-profesional
- servicio;
- profesional opcional;
- fecha;
- disponibilidad;
- reserva;
- validaci├│n backend.

### Fase 5 ΓÇö Seguridad multiusuario
- roles;
- permisos;
- acceso por profesional;
- aislamiento administrativo;
- auditor├¡a de endpoints.

### Fase 6 ΓÇö Hardening y producci├│n
- concurrencia;
- validaciones;
- errores;
- migraciones;
- observabilidad;
- configuraci├│n de producci├│n.

## 20. Regla para prompts del agente
Usar prompts concretos y acotados, con criterios de aceptaci├│n y restricciones expl├¡citas.

Instrucci├│n base:
> ΓÇ£Inspecciona primero la implementaci├│n existente y aplica la soluci├│n m├¡nima necesaria. Conserva la estructura, est├⌐tica, UX y funcionalidades existentes. No modifiques nada que no sea estrictamente necesario para la funcionalidad solicitada.ΓÇ¥

## 21. Principio rector
**Gwen Nails debe evolucionar sobre la arquitectura existente, no reemplazarla.**

Prioridades:
**claridad ΓåÆ seguridad ΓåÆ consistencia ΓåÆ escalabilidad ΓåÆ est├⌐tica.**

## 22. Actualizaci├│n vigente ΓÇö 2026-09-02

Esta copia en Git conserva las secciones hist├│ricas anteriores como contexto. Esta secci├│n prevalece donde existan diferencias. La referencia sincronizada de ChatGPT permanece intacta y no es el documento operativo editable.

### Fuente can├│nica y evidencia
- Repositorio exclusivo: https://github.com/Raultw/GwenAiStudio. No utilizar el repositorio Beta ni su antiguo historial.
- Baseline local importado: 055e5f683e5b90e72be08e441f9d100d3f6d13e6.
- Stack detectado en ese baseline: React 19, Vite 6, TypeScript, Tailwind 4, Express 4, PostgreSQL y fallback de desarrollo en memoria/JSON. No asumir Drizzle sin comprobar dependencias.
- Los informes hist├│ricos son antecedentes reportados, no pruebas ejecutadas sobre Render ni sobre este baseline.
- SEC-001: preparaci├│n de ignore, fixture saneado e informe aprobada en dd360bbc501edef5f13531f8facebbd9299cb4a9; pendiente de integraci├│n. No sane├│ el historial ni retir├│ la base operativa versionada.
- Persisten hallazgos de campos/PIN legados en c├│digo. El usuario ya autoriz├│ su eliminaci├│n como objetivo; no deben considerarse una excepci├│n permanente aceptada para testing. Rotaciones y operaciones sobre datos requieren coordinaci├│n espec├¡fica.

### Decisiones funcionales confirmadas
- Unificar bloqueos bajo Excepciones de disponibilidad restrictivas/expansivas, multi-profesional y cobertura local; no crear un sistema paralelo de bloqueos.
- Preview de impacto y cancelaci├│n transaccional; trazabilidad interna de motivo, fecha, origen y responsable. No revelar el motivo interno a las clientas.
- Cat├ílogo benefit_templates separado de client_benefits y promociones p├║blicas/promotion_usages. Plantillas de porcentaje o monto fijo; vigencia individual desde emisi├│n seg├║n d├¡as definidos en plantilla.
- Compensaci├│n opcional por turno cancelado: checkbox para adjuntar beneficio, una plantilla para el lote, todos seleccionados inicialmente y posibilidad de desmarcar turnos individuales.
- Todos los turnos cancelados requieren aviso por email si cuentan con direcci├│n, reciban beneficio o no. Mostrar tel├⌐fono y ausencia de email al administrador. WhatsApp autom├ítico sigue fuera de alcance.
- Beneficios emitidos conservan sus condiciones e historial, sin depender de cambios posteriores de la plantilla. Vinculaci├│n a turno de origen e idempotencia mediante ├¡ndice ├║nico parcial, chequeo y manejo de conflicto 23505.
- No stacking: la clienta elige entre beneficio individual o promoci├│n, nunca ambos. Mostrar vencimiento al seleccionar.
- La ├║ltima decisi├│n reemplaza el cooldown independiente por c├│digo: cooldown GLOBAL configurable de c├│digos, aplicado por clienta de forma uniforme. Es distinto de la caducidad de cada promoci├│n. Usar una compensaci├│n no debe consumir ese cooldown.
- Fecha de negocio America/Argentina/Buenos_Aires; presentaci├│n DD/MM/YYYY y DD/MM/YYYY HH:mm; persistencia YYYY-MM-DD e ISO UTC seg├║n el tipo.
- Gesti├│n p├║blica prevista: enlace por email, recuperaci├│n por email m├ís c├│digo de reserva o nombre/apellido, c├│digo y clave de gesti├│n, y contacto con sal├│n como alternativa. Respuestas de recuperaci├│n gen├⌐ricas con aviso de spam y posibilidad de corregir datos.
- Mostrar c├│digo/clave y aviso para guardarlos o tomar captura al reservar, tenga o no email. Plazo de cancelaci├│n configurable. No exponer datos de turno antes de verificar acceso.
- Al menos tel├⌐fono o email para identificar/contactar clientas; normalizar. La pol├¡tica definitiva de deduplicaci├│n y cambios de contacto no se considera resuelta.
- Sesi├│n de personal debe sobrevivir recarga; logout expl├¡cito y vencimiento seguro. El cierre de navegador no ofrece garant├¡a absoluta con restauraci├│n de sesiones del navegador: documentar el comportamiento probado.
- SMTP Gmail y Resend tuvieron smoke tests reportados exitosos; eso no demuestra que el flujo de reserva/cancelaci├│n invoque el transporte correctamente.

### Plan retomado y criterios de avance
Cambio propio transaccional en `fee887e`, compartiendo operaci├│n con reset administrativo. Clave actual se verifica bajo bloqueo; endpoint delega una sola operaci├│n. 17 pruebas con SQL/fs simulados y 15 de handler aprobadas. Restan carrera login/reset, rutas alternativas y PostgreSQL/QA real; ├¡tem 4 sigue abierto.

Seguridad complementaria en `101cb4a`: fallo SQL al verificar sesi├│n ya no permite autenticar mediante copia en memoria potencialmente obsoleta; cinco casos aislados aprobados. Se excluye password heredado de respuesta memoria. Self-change/login-reset siguen pendientes; no cerrado/desplegado.

Reset administrativo parcial publicado en `e1b919a`: transacci├│n de hash, obligaci├│n de cambio, revocaci├│n y auditor├¡a; snapshot estricto en memoria. Propuesta Antigravity revisada por Codex; nueve casos con SQL/fs simulados aprobados. No probado sobre DB/disco reales ni desplegado. Restan self-change y carrera login/reset; roadmap 4 no cerrado.

Roadmap de seguimiento del propietario: [lista ordenada y estados](coordination/ROADMAP.md). Conservar numeraci├│n, distinguir implementaci├│n en rama de funcionamiento desplegado y mostrar nuevamente la lista completa cada vez que un tema se cierre. Esta vista resume el estado vigente sin borrar antecedentes.

Autorizaci├│n posterior del propietario: Antigravity CLI puede leer y procesar server.ts y src/server/db.ts, excluyendo secretos/datos de clientes. Diagn├│stico ejecutado tras consentimiento confirm├│ view_file de db.ts y respuesta LECTURA_OK (exit 0). Se retoma coordinaci├│n; runner local captura rutas de herramientas para diagnosticar rechazos futuros. Esto no acredita a├║n la implementaci├│n transaccional pendiente.

Dise├▒o siguiente disponible en `coordination/tasks/AUTH-002-transaction-design.md`: unificar cambio/reset, revocaci├│n y auditor├¡a; resolver competencia de creaci├│n de sesi├│n. Inspecci├│n confirma reset sin revocaci├│n y helpers que silencian fallos. Pendiente implementaci├│n y PostgreSQL aislado; no est├ín cubiertos por las pruebas previas del handler.

Validaciones contextuales publicadas en `6df6715`: tipos string/no vac├¡os, rechazo de clave nueva igual a actual o username; 17 casos aislados del handler aprobados. Sigue pendiente atomicidad conjunta y provisi├│n/Mi cuenta. La revisi├│n autom├ítica bloque├│ el diagn├│stico externo de Antigravity por considerar insuficiente el consentimiento espec├¡fico para compartir c├│digo fuente; se pausa ese despacho, conservando continuidad local autorizada.

Siguiente bloque preparado: `coordination/tasks/AUTH-002-account-followup.md`. Inspecci├│n sobre 645d9b0 muestra pendiente impedir reutilizar clave actual y validar tipos en password-change, adem├ís de revisar atomicidad conjunta de hash/revocaci├│n/auditor├¡a antes de provisi├│n gen├⌐rica. Estos puntos no se consideran implementados ni probados.

Seguridad de persistencia, 2026-09-02: `645d9b0` evita guardar password en texto plano al actualizar usuarios, elimina fallback hardcodeado en createUser y detiene escritura de memoria si falla SQL. Ocho pruebas de funciones extra├¡das con almacenamiento simulado aprobadas; no integraci├│n PostgreSQL ni QA desplegado. Provisi├│n temporal configurable sigue pendiente. Codex complet├│ este bloque tras denegaci├│n de lectura de Antigravity; revisar permisos concretos antes de nuevos pedidos.

Avance posterior del mismo ciclo: checklist visual publicado en `ee562e3`, seis reglas con texto/indicadores verdes y confirmaci├│n de coincidencia. Validaci├│n del formulario compartida con backend. Chrome local con API simulada aprob├│ bloqueo de secuencia, condiciones cumplidas, confirmaci├│n y un ├║nico env├¡o v├ílido con vuelta al login. Antigravity agot├│ tiempo y el revisor repar├│ una edici├│n JSX incompleta antes de publicar. No equivale a QA desplegado ni cierra los flujos de provisi├│n/reset/Mi cuenta.

Actualizaci├│n verificada 2026-09-02 16:25 UTC: pol├¡tica compartida implementada por Antigravity y publicada en `86c5fd6`, rama `antigravity/AUTH-002-session-benefits`. Doce casos del m├│dulo puro aprobados por Codex, con concordancia checklist/validador. No se probaron DB ni navegador con ese m├│dulo. TypeScript global a├║n falla por `node-fetch` ausente en `scripts/test_booking_concurrency.ts`. Siguiente bloque en ejecuci├│n: checklist visual verde y validaci├│n del formulario mediante el m├│dulo compartido. AUTH-002 permanece IN_PROGRESS; la provisi├│n de clave temporal, Mi cuenta y pruebas completas siguen pendientes. Los problemas operativos de permisos Git/Antigravity se resolvieron; el runner detecta respuestas vac├¡as como resultado no verificado.

Decisi├│n vigente de contrase├▒as del propietario: cuentas exclusivas para empleados/administraci├│n; email opcional, sin recupero por email para empleados. Username sugerido inicial+apellido normalizado, sufijo ante duplicados. Clave temporal gen├⌐rica compartida configurada fuera de Git, acceso restringido y cambio obligatorio primer ingreso/reset; administrador restablece olvidadas. Mi cuenta permite cambio con clave actual, nueva y confirmaci├│n. Clave personal de 8 a 16 caracteres (reemplaza 12ΓÇô128 anteriores), may├║scula, min├║scula, d├¡gito y s├¡mbolo; prohibir secuencias ascendentes/descendentes de cuatro n├║meros; no igual usuario/actual/temporal. Checklist textual con condiciones que cambian a verde. Backend autoritativo y pol├¡tica compartida. No invalidar claves existentes al hacer login. Implementar en bloques peque├▒os y probar ambos lados.

AUTH-002 avance local: cinco casos de Chrome con API simulada aprobados (vac├¡o, profesional, pantalla de cambio obligatorio, null inv├ílido, 403). Implementaci├│n parcial preservada tras timeout de Antigravity; revisor corrigi├│ validaci├│n y guardas de respuestas. Pendientes env├¡o de cambio de contrase├▒a y carreras; sin merge/despliegue. Tsc sigue bloqueado por dependencia ausente en suite ajena.

AUTH-002 revisi├│n posterior: falta una vista de cambio obligatorio de contrase├▒a y permisos visuales de cat├ílogo; implementaci├│n focalizada encargada a Antigravity junto con rechazo expl├¡cito de respuestas malformadas y control de respuestas obsoletas. Backend y reglas sin cambios. Diagn├│stico est├ítico publicado en 2cb426d, no confundir con pruebas din├ímicas ni implementaci├│n completada.

AUTH-002, QA navegador real 2026-09-02: login, recarga completa/reapertura del panel, cat├ílogo y creaci├│n de plantilla funcionan con la cuenta nueva. Plantilla QA desactivada y sesi├│n de prueba cerrada. No reproducidos fallos hist├│ricos; pendientes expiraci├│n, roles, errores y revisi├│n de carreras. Ver coordination/reviews/AUTH-002-browser.md. No confundir esta evidencia con correcci├│n de c├│digo o SHA desplegado verificado.

Avance SEC-002: aislamiento de la suite de autenticaci├│n aprobado en 52db6fd, a├║n sin merge. Ejecuci├│n aislada de 39 pruebas exitosa y JSON del proyecto intacto; cierre posterior a cleanup corregido por el revisor. TypeScript global pendiente por dependencia node-fetch ausente en otra suite. Retomar AUTH-002: no confundir pruebas unitarias con recarga real del navegador o creaci├│n de plantillas.

1. AUTH-002 ΓÇö Primera prioridad autorizada: reproducir y corregir sesi├│n al recargar, reconocimiento de superadmin en permisos administrativos, carga y creaci├│n de tipos de beneficio. Diferenciar lista vac├¡a de fallo real; no ocultar 401/403 como ausencia de registros. Mantener est├⌐tica.
2. BOOK-003 ΓÇö Despu├⌐s de revisar AUTH-002: confirmar email de reserva y c├│digo/clave de gesti├│n visibles con aviso de guardado, preservando la pantalla actual.
3. CANCEL-004 ΓÇö Despu├⌐s de BOOK-003: cancelaci├│n individual con compensaci├│n opcional y aviso correcto con/sin beneficio; revalidar el flujo por excepciones.
4. Pendientes funcionales posteriores: recuperaci├│n/cancelaci├│n p├║blica, identificaci├│n de clientas y cooldown global. No implementar decisiones incompletas arbitrariamente.

Cada etapa requiere evidencia reproducible y revisi├│n; actualizar este documento y BACKLOG con commit, pruebas ejecutadas, pendientes y hallazgos. No declarar completado por un resumen del desarrollador.

### Acceso para QA
Recuperaci├│n y consolidaci├│n autorizadas ejecutadas: una cuenta nueva superadmin con email y contrase├▒a del archivo privado; otras 17 cuentas administrativas activas desactivadas, cinco sesiones revocadas, sin eliminaci├│n f├¡sica. Queda una sola cuenta administrativa activa. Verificaci├│n real en Render: login, auth/me, listado benefit-templates, nueva consulta auth/me y logout respondieron HTTP 200. Esto no verifica a├║n recarga de navegador ni creaci├│n de plantillas. Las seis superadmin antes activas coinciden por username con fixtures de scripts/test_auth_suite.ts; no hab├¡a auditor├¡a asociada que permita atribuir ejecuci├│n. Revisar aislamiento de esa suite antes de ejecutarla contra ninguna base.

Actualizaci├│n del propietario: todos los datos del entorno son ficticios/de testing; autoriza creaci├│n, modificaci├│n y limpieza acotada de registros para pruebas. No implica destrucci├│n de bases completas, infraestructura ni env├¡os a terceros. Se prepar├│ un archivo privado local fuera del repositorio, protegido por permisos de Windows; pendiente de completar. AUTH-002 no necesita credenciales SMTP/Resend ni acceso directo a Neon.

No almacenar secretos en Git, informes o chat. Para QA completo del panel hace falta una cuenta dedicada de prueba con rol superadmin y entorno/datos de prueba identificados. Login manual del propietario permite QA de esa sesi├│n, pero no automatizaci├│n de futuros logins; para eso se requiere almac├⌐n local de secretos ignorado y autorizado. PostgreSQL de integraci├│n debe estar separado de Neon operativo; no se requiere compartir credenciales de Neon para inspecci├│n est├ítica o pruebas aisladas.
# Actualización 2026-09-03 — gestión pública, descuentos y seguridad

- La confirmación de reserva genera código público y clave de gestión aleatoria; solo se persiste el hash scrypt de la clave. Pantalla y email indican guardar o capturar ambos datos e incluyen acceso a gestión.
- La clienta puede verificar y cancelar con código+clave. La vista del turno aparece solo después de validar y el plazo mínimo se toma de `plazoCancelacionHoras`.
- Los códigos públicos respetan `cooldownPromocionesDias` global por clienta, independiente de la caducidad de cada promoción. Consumir una compensación individual no modifica este cooldown.
- Los beneficios públicos no se descubren por email o teléfono aislado: se requiere cliente canónico o nombre y apellido exactos junto con un contacto normalizado.
- La cancelación individual administrativa admite una plantilla activa opcional; las cancelaciones por excepción responden tras el commit y no esperan al transporte de email.
- La configuración administrativa incluye teléfono, WhatsApp, plazo de cancelación y cooldown global.
- Se eliminó el PIN legado del modelo/configuración y se protegieron rutas administrativas con RBAC. Las cuentas internas continúan usando usuario y contraseña con sesión HttpOnly.
