# Backlog de coordinación

Estado inicial: 2026-09-02. Esta rama contiene documentación; no cambia la aplicación ni dispara integración en main.

| ID | Prioridad | Estado | Responsable | Objetivo |
|---|---|---|---|---|
| SEC-001 | Alta | CHANGES_REQUESTED | Antigravity | Corregir los hallazgos de `reviews/SEC-001.md` sobre la entrega `6c9037589882f90d0952bd5655a50359bbfb8337`. |
| AUTH-002 | Alta | DRAFT | Sin asignar | Reproducir y corregir restauración de sesión y 401 de tipos de beneficio. |
| BOOK-003 | Media | DRAFT | Sin asignar | Verificar confirmación por email, código y clave de gestión de reserva. |
| CANCEL-004 | Media | DRAFT | Sin asignar | Revisar cancelación individual administrativa y compensación opcional. |

Solo SEC-001 está autorizada para trabajar en esta fase, incluidas las correcciones de revisión dentro de su alcance. Las restantes son antecedentes, no permisos de implementación.

## Evidencia y límites

- Auditoría local: 75 archivos versionados, árbol limpio y baseline `055e5f6`.
- `data/gwen_db.json` contiene credenciales, hashes, sesiones y contactos. No copiar valores a tareas ni comentarios.
- Los reportes anteriores de suites exitosas no sustituyen pruebas sobre este baseline.
- El fallo de login tras recarga y el 401 del catálogo se observaron en `gwennails.ai.studio`, no en Render. Reproducir en el entorno actual antes de atribuirle esos fallos.
- Antigravity informó ejecución interactiva por sesión; automatización desatendida no verificada.
- La carga inicial con riesgos fue autorizada expresamente por el propietario. Esto no obliga a conservarlos ni habilita cambios sensibles sin permiso.

## Mantenimiento

Antigravity publica progreso en su rama mediante `docs/coordination/deliveries/SEC-001.md`. El arquitecto actualiza este backlog al revisar. Las aprobaciones corresponden al alcance de cada tarea, no a un permiso general para modificar toda la aplicación.
