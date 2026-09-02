# Backlog de coordinación

Vista ordenada para el propietario: [Roadmap de soluciones y mejoras](ROADMAP.md). Repetir la lista completa al cerrar cada ítem, según evidencia y criterios de cierre de ese documento.

Estado inicial: 2026-09-02. Esta rama contiene documentación; no cambia la aplicación ni dispara integración en main.

| ID | Prioridad | Estado | Responsable | Objetivo |
|---|---|---|---|---|
| SEC-002 | Alta | REVIEW | Antigravity | Aislamiento aprobado en 52db6fd: 39 pruebas pasan, exit 0, JSON operativo sin cambios. Pendiente integración; tsc global falla por node-fetch ausente en otra suite. |
| SEC-001 | Alta | REVIEW | Antigravity | Correcciones aprobadas en `dd360bbc501edef5f13531f8facebbd9299cb4a9`; pendiente de integración autorizada. Ver `reviews/SEC-001-final.md`. |
| AUTH-002 | Alta | IN_PROGRESS | Antigravity/Codex | Validaciones contextuales en 6df6715 con 17 pruebas aisladas. Consentimiento específico concedido y lectura CLI verificada. Siguiente: diseño AUTH-002-transaction-design.md; restan atomicidad, provisión/reset/Mi cuenta y QA. |
| BOOK-003 | Media | DRAFT | Sin asignar | Verificar confirmación por email, código y clave de gestión de reserva. |
| CANCEL-004 | Media | DRAFT | Sin asignar | Revisar cancelación individual administrativa y compensación opcional. |

El propietario retomó el plan el 2026-09-02: AUTH-002 queda autorizada como primera etapa. BOOK-003 y CANCEL-004 se mantienen secuenciales pendientes de preparación de alcance tras la revisión anterior. Documento maestro mantenible: [Contexto y Arquitectura](../Gwen_Nails_Contexto_y_Arquitectura.md), sección 22. No iniciar tareas posteriores ni ampliar permisos por antecedentes históricos.

Actualización posterior: propietario autorizó continuidad autónoma del plan y mejoras de seguridad, con avisos breves sin confirmaciones rutinarias. SEC-002 precede a ejecutar suites de AUTH-002. Preparar alcances acotados de BOOK-003 y CANCEL-004 al avanzar; conservar límites de operaciones sensibles. El resumen de recuperación sin cuentas, emails ni credenciales fue autorizado para Git y publicado.

## Evidencia y límites

- Auditoría local: 75 archivos versionados, árbol limpio y baseline `055e5f6`.
- `data/gwen_db.json` contiene credenciales, hashes, sesiones y contactos. No copiar valores a tareas ni comentarios.
- Los reportes anteriores de suites exitosas no sustituyen pruebas sobre este baseline.
- El fallo de login tras recarga y el 401 del catálogo se observaron en `gwennails.ai.studio`, no en Render. Reproducir en el entorno actual antes de atribuirle esos fallos.
- Coordinación programada configurada; dos rondas reales de Antigravity CLI completadas. Primer disparo del programador pendiente de observar. Ver `AUTOMATION.md`.
- La carga inicial con riesgos fue autorizada expresamente por el propietario. Esto no obliga a conservarlos ni habilita cambios sensibles sin permiso.

## Mantenimiento

Antigravity publica progreso en su rama mediante `docs/coordination/deliveries/SEC-001.md`. El arquitecto actualiza este backlog al revisar. Las aprobaciones corresponden al alcance de cada tarea, no a un permiso general para modificar toda la aplicación.
