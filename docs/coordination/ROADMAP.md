# Gwen Nails — Roadmap de soluciones y mejoras

Actualizado: 2026-09-02. Lista de seguimiento para el propietario. Mantener numeración estable y mostrar la lista completa cuando se cierre un ítem.

Estados: ✅ cerrado y verificado en su entorno correspondiente; 🧪 implementado y probado parcialmente, pendiente de integración/validación final; 🔄 en curso; ⏳ pendiente; 💬 decisión pendiente.

Para una funcionalidad de la aplicación, cerrado requiere revisión aprobada, integración conforme a permisos, despliegue del commit identificado y prueba funcional en Render. Una rama publicada, un mock o un informe histórico no bastan. Integrar y verificar por etapa: no esperar al final del roadmap para entregar funcionalidad utilizable. Si aparece una regresión, reabrir el ítem.

## Lista ordenada

1. ✅ **Coordinación y seguimiento automático.** Git central, instrucciones y entregas, consulta programada cada cinco minutos y consentimiento de lectura de código para Antigravity verificado. Cerrado para configuración inicial; incidencias del CLI se siguen atendiendo.
2. 🧪 **Base de seguridad y pruebas aisladas.** Exclusiones/fixture seguro y suite aislada revisados. Corrección mínima de globalThis.fetch aplicada en test_booking_concurrency.ts permitiendo 0 errores en tsc global. Pendiente integración autorizada a main y QA.
3. 🧪 **Reglas de contraseña y guía visual.** 8–16 caracteres, condiciones visibles en verde, confirmación, rechazo de secuencias y reutilización, protección contra persistencia de contraseña en texto plano. Pendientes integración y QA desplegado.
4. 🧪 **Cambio y restablecimiento de contraseña seguros.** Reset y cambio propio comparten operación transaccional atómica bajo SELECT ... FOR UPDATE en PostgreSQL y snapshot atómico en memoria; authenticateAndCreateSession coordina validación y creación de sesión bajo bloqueo previniendo sesiones activas con credenciales viejas; 17 casos SQL/fs simulados, 15 de handler y 5 de control de sesión aprobados. Pendiente QA en Render.
5. 🧪 **Cuentas de empleados y “Mi cuenta”.** Generación automática de username (inicial+apellido) con resolución numérica de colisiones; email no obligatorio para empleados; clave temporal común obtenida exclusivamente desde process.env.EMPLOYEE_DEFAULT_TEMP_PASSWORD (sin hardcodeo); cambio forzado en primer login (mustChangePassword); protección de rutas alternativas PUT /api/users/:id frente a modificación de contraseñas; rechazo de clave temporal en cambio voluntario; pestaña “Mi cuenta” accesible en panel para todos los roles (superadmin, admin, profesional, empleado) con checklist dinámico en verde. Pendiente QA en Render.
6. 🧪 **Sesión persistente y permisos de Tipos de beneficio.** Matriz de roles superadmin/admin/profesional asegurada; sesiones fail-closed sin fallback a memoria ante error de base de datos; catálogo distingue explícitamente lista vacía ("No hay tipos de beneficio cargados") frente a errores reales de autenticación o permisos (401/403); creación y edición restringidas a administradores sin privilegios espurios para profesionales. Pendiente QA en Render.
7. ⏳ **Confirmación de reserva por email y datos de gestión.** Verificar envío real a casilla propia autorizada; mostrar código, clave y aviso de guardado/captura; incluirlos en email. Conservar estética de confirmación.
8. ⏳ **Cancelación administrativa y compensación opcional.** Revisar cancelación individual y regresión por excepciones: beneficio por turno, plantilla común por lote y exclusión individual, vigencia desde emisión, aviso genérico con/sin beneficio. Mostrar teléfono y ausencia de email; no revelar motivo interno ni activar WhatsApp automático.
9. ⏳ **Elección de descuentos y cooldown global.** Elegir un solo beneficio o código, mostrar vencimiento, explicar bloqueo de X días y cuándo puede volver a usar códigos. Cooldown global por clienta distinto de caducidad; compensación no consume ese cooldown. Conservar reglas atómicas existentes verificándolas en versión actual.
10. 💬 **Identificación de clientas sin duplicados.** Exigir al menos teléfono o email, normalizar y contemplar errores/cambios de contacto. Definir con el propietario el tratamiento de coincidencias ambiguas antes de fusionar registros automáticamente. Nombre/apellido no acreditan por sí solos identidad.
11. ⏳ **Configuración del salón y cancelaciones.** Ubicación clara en panel para teléfono, WhatsApp de contacto y plazo de cancelación; cooldown global accesible y diferenciado de vigencias. Reutilizar módulos existentes cuando corresponda.
12. ⏳ **Autocancelación de la clienta.** Enlace por email, recuperación con email más código o nombre/apellido, código+clave, y contacto con salón. Respuestas genéricas, spam/reintento, verificación antes de mostrar turno y confirmación final. Respetar plazo configurado.
13. ⏳ **Auditoría integral y cierre de los pendientes de seguridad.** Recorrer reservas/descuentos/cancelaciones, fechas argentinas, notificaciones, concurrencia PostgreSQL aislada, permisos y protección de información. Revisar exposición de endpoints, credenciales legadas y dependencia de testing. Corregir por prioridad; no posponer un hallazgo urgente hasta este último punto.

## Evidencia y seguimiento

- 1: automatización configurada; actualmente en modo manual por decisión expresa del propietario (coordinación automática pausada).
- 2: SEC-001 y SEC-002 completados. Corrección de `node-fetch` resuelta mediante `globalThis.fetch` nativo sin alterar aserciones. `tsc --noEmit` compila con 0 errores.
- 3: política 8–16 caracteres y checklist reactivo implementados y validados en componentes y suites aisladas.
- 4: `authenticateAndCreateSession` y `changeUserCredentialAtomic` implementados en `src/server/db.ts` y cableados en `/api/auth/login`. 17 casos de reset atómico y 5 casos de concurrencia aprobados.
- 5: `generateProposedUsername` implementado en `src/server/clientMatching.ts`. Protección en `PUT /api/users/:id` bloquea credenciales y rechaza bypass. Pestaña "Mi cuenta" operativa en `AdminModal.tsx`.
- 6: `BenefitTemplatesAdmin.tsx` actualizado para mostrar "No hay tipos de beneficio cargados" distinguiendo errores de red/403.
- 7: BOOK-003; 8: CANCEL-004. Próximas etapas pendientes de asignación.
