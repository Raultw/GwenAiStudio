# Gwen Nails — Roadmap de soluciones y mejoras

Actualizado: 2026-09-03. Lista de seguimiento para el propietario. Mantener numeración estable y mostrar la lista completa cuando se cierre un ítem. Coordinación automática PAUSADA; revisión manual retomada.

Estados: ✅ cerrado y verificado en su entorno correspondiente; 🧪 implementado y probado parcialmente, pendiente de integración/validación final; 🔄 en curso; ⏳ pendiente; 💬 decisión pendiente.

Para una funcionalidad de la aplicación, cerrado requiere revisión aprobada, integración conforme a permisos, despliegue del commit identificado y prueba funcional en Render. Una rama publicada, un mock o un informe histórico no bastan. Integrar y verificar por etapa: no esperar al final del roadmap para entregar funcionalidad utilizable. Si aparece una regresión, reabrir el ítem.

## Lista ordenada

1. ✅ **Coordinación y seguimiento automático.** Git central, instrucciones y entregas, consulta programada cada cinco minutos y consentimiento de lectura de código para Antigravity verificado. Cerrado para configuración inicial; incidencias del CLI se siguen atendiendo.
2. 🧪 **Base de seguridad y pruebas aisladas.** Exclusiones/fixture seguro y suite aislada revisados. Pendientes integración, resolver dependencia que bloquea TypeScript y revisar datos sensibles aún versionados. Cualquier saneamiento destructivo del historial requiere autorización específica.
3. 🧪 **Reglas de contraseña y guía visual.** 8–16 caracteres, condiciones visibles en verde, confirmación, rechazo de secuencias y reutilización, protección contra persistencia de contraseña en texto plano. Pendientes integración y QA desplegado.
4. 🔄 **Cambio y restablecimiento de contraseña seguros.** Reset y cambio propio comparten operación transaccional en fee887e; 17 casos SQL/fs simulados y 15 de handler aprobados. Pendientes competencia login/reset, rutas alternativas y pruebas PostgreSQL/QA desplegado.
5. 🔄 **Cuentas de empleados y “Mi cuenta”.** Entrega 2c43de1 incorpora username automático, email opcional y Mi cuenta. Revisión solicita corregir cambio inicial eludible, errores de creación/reset ocultados por UI y texto de contraseña obsoleto. Protección concurrente del superadmin y QA pendientes.
6. 🔄 **Sesión persistente y permisos de Tipos de beneficio.** Completar matriz admin/superadmin/profesional, recarga/logout/expiración, lista vacía frente a error real y creación/edición. QA base Render y casos locales pasaron; falta cierre completo sobre versión integrada.
7. ⏳ **Confirmación de reserva por email y datos de gestión.** Verificar envío real a casilla propia autorizada; mostrar código, clave y aviso de guardado/captura; incluirlos en email. Conservar estética de confirmación.
8. ⏳ **Cancelación administrativa y compensación opcional.** Revisar cancelación individual y regresión por excepciones: beneficio por turno, plantilla común por lote y exclusión individual, vigencia desde emisión, aviso genérico con/sin beneficio. Mostrar teléfono y ausencia de email; no revelar motivo interno ni activar WhatsApp automático.
9. ⏳ **Elección de descuentos y cooldown global.** Elegir un solo beneficio o código, mostrar vencimiento, explicar bloqueo de X días y cuándo puede volver a usar códigos. Cooldown global por clienta distinto de caducidad; compensación no consume ese cooldown. Conservar reglas atómicas existentes verificándolas en versión actual.
10. 💬 **Identificación de clientas sin duplicados.** Exigir al menos teléfono o email, normalizar y contemplar errores/cambios de contacto. Definir con el propietario el tratamiento de coincidencias ambiguas antes de fusionar registros automáticamente. Nombre/apellido no acreditan por sí solos identidad.
11. ⏳ **Configuración del salón y cancelaciones.** Ubicación clara en panel para teléfono, WhatsApp de contacto y plazo de cancelación; cooldown global accesible y diferenciado de vigencias. Reutilizar módulos existentes cuando corresponda.
12. ⏳ **Autocancelación de la clienta.** Enlace por email, recuperación con email más código o nombre/apellido, código+clave, y contacto con salón. Respuestas genéricas, spam/reintento, verificación antes de mostrar turno y confirmación final. Respetar plazo configurado.
13. ⏳ **Auditoría integral y cierre de los pendientes de seguridad.** Recorrer reservas/descuentos/cancelaciones, fechas argentinas, notificaciones, concurrencia PostgreSQL aislada, permisos y protección de información. Revisar exposición de endpoints, credenciales legadas y dependencia de testing. Corregir por prioridad; no posponer un hallazgo urgente hasta este último punto.

## Evidencia y seguimiento

- Revisión manual 2026-09-03: entrega 2c43de1 en CHANGES_REQUESTED; ver reviews/AUTH-002-manual-20260903.md. Cinco suites existentes pasan, tsc y build cliente/servidor pasan. Nueva regresión confirma que contraseña explícita evita cambio inicial. Login/reset y permisos aún requieren pruebas reales; ningún ítem funcional cerrado. Esto actualiza el fallo histórico de node-fetch mencionado abajo, ya resuelto en esta entrega.

- 1: automatización activa a cinco minutos, disparos observados y diagnóstico de lectura autorizado. No garantiza ejecución continua si app/equipo/cuotas no lo permiten.
- 2: SEC-001 dd360bbc; SEC-002 52db6fd, 39 pruebas aisladas. TypeScript global pendiente por node-fetch ausente en test_booking_concurrency.ts. No confundir .gitignore con eliminación de información ya versionada.
- 3: política 86c5fd6, checklist ee562e3, persistencia 645d9b0 y validaciones 6df6715. Pruebas: 12 casos puros, navegador/API simulada, 8 casos de persistencia y 17 del handler. No acredita integración SQL ni despliegue.
- 4: tasks/AUTH-002-transaction-design.md.
- Avance parcial 4: 101cb4a rechaza fallback de sesión a memoria tras fallo SQL; cinco pruebas aisladas aprobadas. No constituye cierre del ítem.
- 5–6: AUTH-002 y tasks/AUTH-002-account-followup.md. Los defectos históricos de sesión/catálogo no se reprodujeron en el QA base de Render; aún faltan escenarios y validar commit desplegado.
- 7: BOOK-003; 8: CANCEL-004. El resto conserva decisiones del documento maestro, pendiente de convertir a tareas acotadas antes de implementar.

Al cambiar un estado: registrar fecha, commit, evidencia y pendiente. Al cerrar un ítem: actualizar ROADMAP, BACKLOG y documento maestro; mostrar al propietario los 13 ítems con sus estados actuales. No marcar cerrado por agotamiento de tiempo ni por fin de una ejecución del agente. Los ciclos sin cierre no requieren repetir la lista.
