# Gwen Nails — Contexto y Arquitectura del Proyecto

## 1. Identidad
**Repositorio de referencia:** https://github.com/Raultw/GwenAiStudioBeta

Gwen Nails es una plataforma full-stack de gestión y reservas online para estudios de belleza, manicura y bienestar, preparada para evolucionar hacia múltiples profesionales y, potencialmente, múltiples negocios.

## 2. Stack
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts/D3.
- Backend: Node.js, Express, TypeScript, esbuild, REST/JSON.
- Persistencia: PostgreSQL, `pg`, Drizzle/SQL; JSON local únicamente como soporte de desarrollo.

## 3. Arquitectura
```text
Frontend React
      │ REST/JSON
      ▼
Backend Express
      ├── Gestión / Administración
      ├── CRM
      ├── Reservas
      ├── Profesionales
      ├── Servicios
      └── Horarios
              │
              ▼
      Motor de Disponibilidad
              │
              ▼
          PostgreSQL
```

`availabilityEngine.ts` es la fuente de verdad para calcular disponibilidad. No duplicar sus reglas innecesariamente en frontend ni en endpoints.

## 4. Disponibilidad
La disponibilidad cruza:
1. horario del local;
2. horario del profesional;
3. excepciones de disponibilidad;
4. servicio;
5. duración;
6. buffer;
7. turnos existentes;
8. profesional seleccionado o profesionales capaces de realizar el servicio.

Conceptualmente:
```text
Horario local ∩ Horario profesional
+ servicio/duración/buffer
− reservas/bloqueos/excepciones aplicables
→ slots disponibles
```

Si el cliente no elige profesional, se consideran los profesionales habilitados para el servicio. Si lo elige, solo se considera ese profesional y se valida su aptitud para el servicio.

## 5. Profesionales y servicios
- Un profesional puede realizar múltiples servicios.
- Un servicio puede ser realizado por múltiples profesionales.
- El cliente puede elegir profesional o dejar que el sistema determine disponibilidad.
- El backend siempre debe validar la relación profesional-servicio.

## 6. Estados de turnos
Solo existen:
- **Pendiente**
- **Completado**
- **Cancelado**

No reintroducir **Confirmado**. Los turnos cancelados no bloquean disponibilidad.

## 7. Horarios
El horario del local y el de cada profesional están relacionados, pero son configuraciones independientes.

El local puede tener horarios diferentes por día, horario corrido o cortado, días cerrados y múltiples intervalos.

Los profesionales pueden trabajar jornadas más acotadas.

La disponibilidad efectiva debe respetar la cobertura del local salvo extensión explícita.

## 8. Vigencia
Los cambios de horario semanal se versionan mediante vigencia. No alterar retrospectivamente horarios históricos ni crear sistemas paralelos al mecanismo existente.

## 9. Excepciones de disponibilidad
Usar siempre el término **Excepción de disponibilidad**, no “Excepción de horario”.

Sirven para modificar la disponibilidad de una fecha puntual sin afectar fechas futuras.

Ejemplo:
```text
Sábado habitual: 09:00–17:00
Excepción 29/08: 09:00–20:00
```

La selección de profesionales debe admitir múltiples profesionales. La BD puede conservar registros independientes por profesional; no es necesario almacenar arrays de IDs en una fila. La creación múltiple debe ser transaccional.

## 10. Cobertura local/profesional
Si un horario profesional supera el horario del local, advertir al administrador.

- En un cambio semanal, una extensión aceptada debe respetar la vigencia correspondiente.
- En una excepción puntual, una extensión aceptada debe afectar únicamente esa fecha mediante una excepción del local.
- Nunca convertir accidentalmente una excepción puntual en un cambio semanal permanente.

## 11. Excepción vs bloqueo
**Excepción de disponibilidad:** modifica la disponibilidad habitual.
**Bloqueo:** impide reservar un tramo que normalmente estaría disponible.

Ejemplo de bloqueo: 14:00–15:00 dentro de una jornada 09:00–17:00.

Mantener ambas responsabilidades claramente diferenciadas.

## 12. Agenda y detalle de turno
La Agenda permite visualizar turnos, estados, completarlos y acceder a su detalle.

El detalle del turno debe priorizar el contexto del turno actual sin duplicar innecesariamente la ficha completa de la clienta.

Las secciones:
- Alertas y antecedentes
- Preferencias & estilo
- Tips y Softgel

se muestran como solo lectura en este contexto, colapsables. **Alertas y antecedentes** queda desplegada por defecto; las otras dos, colapsadas. La edición continúa en la ficha de la clienta.

## 13. Turno anterior
Debe ser el último turno anterior **marcado como Completado/Finalizado**, no simplemente el último creado.

Mostrar:
- fecha;
- hora;
- servicio;
- anotaciones del cliente sobre el trabajo a realizar.

Si no existen anotaciones: **“No informó detalles”**.

Nunca confundir el turno actual con el anterior.

## 14. CRM
La ficha de clienta puede contener teléfono, email, historial, cantidad de servicios, gasto acumulado, turno anterior, alertas/antecedentes, preferencias/estilo, tips/Softgel y notas administrativas.

## 15. Métricas
El sistema ofrece visión general de demanda, servicios, valores económicos, evolución, proyecciones y comportamiento de clientas. No asumir que reemplaza un sistema contable completo.

## 16. Seguridad
- Toda operación administrativa se valida en backend.
- No confiar en permisos enviados desde React.
- Validar IDs, fechas, horarios, estados y relaciones.
- Usar transacciones cuando una operación modifique múltiples registros.
- No mantener credenciales hardcodeadas/backdoors.
- PostgreSQL es la fuente de verdad en producción.

En producción:
```text
DATABASE_URL obligatoria
→ PostgreSQL
→ sin fallback silencioso a JSON
```
Una caída de PostgreSQL debe producir un error controlado.

## 17. Concurrencia
`validateBookingSlot()` es una validación de negocio, no la única garantía. La creación de turnos debe contar con protección transaccional/relacional adecuada para impedir reservas incompatibles concurrentes. La segunda solicitud debe recibir un error controlado y amigable.

## 18. Filosofía de evolución
1. Inspeccionar primero el código existente.
2. Reutilizar arquitectura y funciones existentes.
3. Evitar sistemas paralelos.
4. Modificar únicamente lo estrictamente necesario.
5. Mantener estética y UX actuales.
6. No cambiar nombres, endpoints, componentes o comportamientos no relacionados.
7. Mantener compatibilidad con datos existentes.
8. Priorizar integridad y seguridad.
9. Centralizar disponibilidad en `availabilityEngine.ts`.
10. Implementar cambios en etapas pequeñas y verificables.

## 19. Roadmap
### Fase 0 — Seguridad y robustez
- credenciales/backdoors;
- endpoints administrativos;
- concurrencia;
- producción/dev;
- cobertura.

### Fase 1 — Excepciones de disponibilidad
- UI;
- selección múltiple de profesionales;
- creación transaccional;
- excepciones local/profesional;
- tipos necesarios.

### Fase 2 — Extensión puntual del local
- advertencia;
- confirmación;
- extensión semanal según contexto;
- extensión puntual mediante excepción.

### Fase 3 — Gestión completa de horarios
- local;
- profesionales;
- vigencias;
- múltiples intervalos;
- excepciones;
- bloqueos;
- UX unificada.

### Fase 4 — Experiencia pública multi-profesional
- servicio;
- profesional opcional;
- fecha;
- disponibilidad;
- reserva;
- validación backend.

### Fase 5 — Seguridad multiusuario
- roles;
- permisos;
- acceso por profesional;
- aislamiento administrativo;
- auditoría de endpoints.

### Fase 6 — Hardening y producción
- concurrencia;
- validaciones;
- errores;
- migraciones;
- observabilidad;
- configuración de producción.

## 20. Regla para prompts del agente
Usar prompts concretos y acotados, con criterios de aceptación y restricciones explícitas.

Instrucción base:
> “Inspecciona primero la implementación existente y aplica la solución mínima necesaria. Conserva la estructura, estética, UX y funcionalidades existentes. No modifiques nada que no sea estrictamente necesario para la funcionalidad solicitada.”

## 21. Principio rector
**Gwen Nails debe evolucionar sobre la arquitectura existente, no reemplazarla.**

Prioridades:
**claridad → seguridad → consistencia → escalabilidad → estética.**

## 22. Actualización vigente — 2026-09-02

Esta copia en Git conserva las secciones históricas anteriores como contexto. Esta sección prevalece donde existan diferencias. La referencia sincronizada de ChatGPT permanece intacta y no es el documento operativo editable.

### Fuente canónica y evidencia
- Repositorio exclusivo: https://github.com/Raultw/GwenAiStudio. No utilizar el repositorio Beta ni su antiguo historial.
- Baseline local importado: 055e5f683e5b90e72be08e441f9d100d3f6d13e6.
- Stack detectado en ese baseline: React 19, Vite 6, TypeScript, Tailwind 4, Express 4, PostgreSQL y fallback de desarrollo en memoria/JSON. No asumir Drizzle sin comprobar dependencias.
- Los informes históricos son antecedentes reportados, no pruebas ejecutadas sobre Render ni sobre este baseline.
- SEC-001: preparación de ignore, fixture saneado e informe aprobada en dd360bbc501edef5f13531f8facebbd9299cb4a9; pendiente de integración. No saneó el historial ni retiró la base operativa versionada.
- Persisten hallazgos de campos/PIN legados en código. El usuario ya autorizó su eliminación como objetivo; no deben considerarse una excepción permanente aceptada para testing. Rotaciones y operaciones sobre datos requieren coordinación específica.

### Decisiones funcionales confirmadas
- Unificar bloqueos bajo Excepciones de disponibilidad restrictivas/expansivas, multi-profesional y cobertura local; no crear un sistema paralelo de bloqueos.
- Preview de impacto y cancelación transaccional; trazabilidad interna de motivo, fecha, origen y responsable. No revelar el motivo interno a las clientas.
- Catálogo benefit_templates separado de client_benefits y promociones públicas/promotion_usages. Plantillas de porcentaje o monto fijo; vigencia individual desde emisión según días definidos en plantilla.
- Compensación opcional por turno cancelado: checkbox para adjuntar beneficio, una plantilla para el lote, todos seleccionados inicialmente y posibilidad de desmarcar turnos individuales.
- Todos los turnos cancelados requieren aviso por email si cuentan con dirección, reciban beneficio o no. Mostrar teléfono y ausencia de email al administrador. WhatsApp automático sigue fuera de alcance.
- Beneficios emitidos conservan sus condiciones e historial, sin depender de cambios posteriores de la plantilla. Vinculación a turno de origen e idempotencia mediante índice único parcial, chequeo y manejo de conflicto 23505.
- No stacking: la clienta elige entre beneficio individual o promoción, nunca ambos. Mostrar vencimiento al seleccionar.
- La última decisión reemplaza el cooldown independiente por código: cooldown GLOBAL configurable de códigos, aplicado por clienta de forma uniforme. Es distinto de la caducidad de cada promoción. Usar una compensación no debe consumir ese cooldown.
- Fecha de negocio America/Argentina/Buenos_Aires; presentación DD/MM/YYYY y DD/MM/YYYY HH:mm; persistencia YYYY-MM-DD e ISO UTC según el tipo.
- Gestión pública prevista: enlace por email, recuperación por email más código de reserva o nombre/apellido, código y clave de gestión, y contacto con salón como alternativa. Respuestas de recuperación genéricas con aviso de spam y posibilidad de corregir datos.
- Mostrar código/clave y aviso para guardarlos o tomar captura al reservar, tenga o no email. Plazo de cancelación configurable. No exponer datos de turno antes de verificar acceso.
- Al menos teléfono o email para identificar/contactar clientas; normalizar. La política definitiva de deduplicación y cambios de contacto no se considera resuelta.
- Sesión de personal debe sobrevivir recarga; logout explícito y vencimiento seguro. El cierre de navegador no ofrece garantía absoluta con restauración de sesiones del navegador: documentar el comportamiento probado.
- SMTP Gmail y Resend tuvieron smoke tests reportados exitosos; eso no demuestra que el flujo de reserva/cancelación invoque el transporte correctamente.

### Plan retomado y criterios de avance
AUTH-002, QA navegador real 2026-09-02: login, recarga completa/reapertura del panel, catálogo y creación de plantilla funcionan con la cuenta nueva. Plantilla QA desactivada y sesión de prueba cerrada. No reproducidos fallos históricos; pendientes expiración, roles, errores y revisión de carreras. Ver coordination/reviews/AUTH-002-browser.md. No confundir esta evidencia con corrección de código o SHA desplegado verificado.

Avance SEC-002: aislamiento de la suite de autenticación aprobado en 52db6fd, aún sin merge. Ejecución aislada de 39 pruebas exitosa y JSON del proyecto intacto; cierre posterior a cleanup corregido por el revisor. TypeScript global pendiente por dependencia node-fetch ausente en otra suite. Retomar AUTH-002: no confundir pruebas unitarias con recarga real del navegador o creación de plantillas.

1. AUTH-002 — Primera prioridad autorizada: reproducir y corregir sesión al recargar, reconocimiento de superadmin en permisos administrativos, carga y creación de tipos de beneficio. Diferenciar lista vacía de fallo real; no ocultar 401/403 como ausencia de registros. Mantener estética.
2. BOOK-003 — Después de revisar AUTH-002: confirmar email de reserva y código/clave de gestión visibles con aviso de guardado, preservando la pantalla actual.
3. CANCEL-004 — Después de BOOK-003: cancelación individual con compensación opcional y aviso correcto con/sin beneficio; revalidar el flujo por excepciones.
4. Pendientes funcionales posteriores: recuperación/cancelación pública, identificación de clientas y cooldown global. No implementar decisiones incompletas arbitrariamente.

Cada etapa requiere evidencia reproducible y revisión; actualizar este documento y BACKLOG con commit, pruebas ejecutadas, pendientes y hallazgos. No declarar completado por un resumen del desarrollador.

### Acceso para QA
Recuperación y consolidación autorizadas ejecutadas: una cuenta nueva superadmin con email y contraseña del archivo privado; otras 17 cuentas administrativas activas desactivadas, cinco sesiones revocadas, sin eliminación física. Queda una sola cuenta administrativa activa. Verificación real en Render: login, auth/me, listado benefit-templates, nueva consulta auth/me y logout respondieron HTTP 200. Esto no verifica aún recarga de navegador ni creación de plantillas. Las seis superadmin antes activas coinciden por username con fixtures de scripts/test_auth_suite.ts; no había auditoría asociada que permita atribuir ejecución. Revisar aislamiento de esa suite antes de ejecutarla contra ninguna base.

Actualización del propietario: todos los datos del entorno son ficticios/de testing; autoriza creación, modificación y limpieza acotada de registros para pruebas. No implica destrucción de bases completas, infraestructura ni envíos a terceros. Se preparó un archivo privado local fuera del repositorio, protegido por permisos de Windows; pendiente de completar. AUTH-002 no necesita credenciales SMTP/Resend ni acceso directo a Neon.

No almacenar secretos en Git, informes o chat. Para QA completo del panel hace falta una cuenta dedicada de prueba con rol superadmin y entorno/datos de prueba identificados. Login manual del propietario permite QA de esa sesión, pero no automatización de futuros logins; para eso se requiere almacén local de secretos ignorado y autorizado. PostgreSQL de integración debe estar separado de Neon operativo; no se requiere compartir credenciales de Neon para inspección estática o pruebas aisladas.
