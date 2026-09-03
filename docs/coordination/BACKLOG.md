# Backlog de coordinación

Vista ordenada para el propietario: [Roadmap de soluciones y mejoras](ROADMAP.md). Repetir la lista completa al cerrar cada ítem, según evidencia y criterios de cierre de ese documento.

Estado al: 2026-09-03. Ejecución manual activa según indicaciones del propietario. Coordinación automática con Codex PAUSADA.

| ID | Prioridad | Estado | Responsable | Objetivo |
|---|---|---|---|---|
| SEC-002 | Alta | REVIEW | Antigravity | Aislamiento aprobado en 52db6fd: 39 pruebas pasan, exit 0, JSON operativo sin cambios. Corrección limpia en test_booking_concurrency.ts (globalThis.fetch); tsc global pasa con 0 errores. |
| SEC-001 | Alta | REVIEW | Antigravity | Correcciones aprobadas en `dd360bbc501edef5f13531f8facebbd9299cb4a9`; fixture data/gwen_db.example.json creado y data/gwen_db.json aislado en .gitignore. |
| AUTH-002 | Alta | REVIEW | Antigravity | Implementación completa y verificada: atomicidad en login/reset (authenticateAndCreateSession con FOR UPDATE), protección de PUT /api/users/:id contra bypass de credenciales, generador de username por nombre/apellido con colisiones numéricas, clave temporal por variable de entorno privada, pestaña "Mi cuenta" para todos los roles con checklist dinámico en verde, y catálogo de beneficios distinguiendo lista vacía de error de permisos. 64 pruebas aisladas pasan, build Vite exitoso, pendiente validación en Render tras despliegue. |
| BOOK-003 | Media | REVIEW | Codex | Confirmación visual/email con código, clave y enlace implementada; pendiente QA Render. |
| CANCEL-004 | Media | REVIEW | Codex | Cancelación individual con plantilla opcional y notificación implementada; pendiente QA Render. |
| EXC-005 | Alta | REVIEW | Codex | Respuesta desacoplada del SMTP y error visible en modal; pendiente reproducción en Render. |
| BENEF-006 | Alta | REVIEW | Codex | Elegibilidad exige identidad canónica o nombre/apellido+contacto; pendiente QA Render. |

## Evidencia técnica y límites de AUTH-002

- `authenticateAndCreateSession`: implementado con transacción pesimista `SELECT ... FOR UPDATE` en PostgreSQL y snapshot atómico seguro en memoria. Protege contra condiciones de carrera entre login y admin reset / password change.
- `PUT /api/users/:id`: rechaza con 400 cualquier intento de enviar `password`, `passwordHash`, `salt` o `mustChangePassword`, obligando a usar las operaciones atómicas correspondientes.
- Generación de usuarios: `generateProposedUsername(nombre, apellido, existingUsernames)` genera inicial + apellido normalizado sin acentos con resolución secuencial de colisiones (`gnails`, `gnails1`, `gnails2`).
- Clave temporal: no se hardcodea en código; se toma de `process.env.EMPLOYEE_DEFAULT_TEMP_PASSWORD || process.env.EMPLOYEE_TEMP_PASSWORD`. Si el usuario intenta cambiar su clave por esta clave temporal, la operación es rechazada con mensaje explicativo.
- Pestaña "Mi cuenta": añadida en `AdminModal.tsx` con soporte para roles superadmin, admin, profesional y empleado. Incluye resumen de perfil y formulario de cambio de clave con checklist visual en verde y confirmación reactiva.
- Catálogo de beneficios: `BenefitTemplatesAdmin.tsx` muestra `"No hay tipos de beneficio cargados"` cuando la lista está vacía, diferenciando estados de error de red (500) o permisos (403/401).
- Pruebas: 64 pruebas aisladas ejecutadas y aprobadas (17 de reset atómico, 15 de contexto/handlers, 5 de sesiones fail-closed, 8 de persistencia de credenciales, y 19 de la suite integral AUTH-002).
- Compilación: `tsc --noEmit` arroja 0 errores en todo el proyecto; `vite build` genera el bundle de producción exitosamente en menos de 4 segundos.

## Mantenimiento

Antigravity publica progreso en la rama `antigravity/AUTH-002-session-benefits` mediante `docs/coordination/deliveries/AUTH-002.md`.
