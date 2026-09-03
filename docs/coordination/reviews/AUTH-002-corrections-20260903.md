# AUTH-002 — Revisión de correcciones

Fecha 2026-09-03. Commits revisados: `093a9d5`, `3026891` sobre `2c43de1`. Veredicto: **APROBADO EL ALCANCE CORRECTIVO; AUTH-002 continúa REVIEW**.

Codex implementó las correcciones ante bloqueo persistente del CLI de Antigravity: alta administrativa siempre fuerza cambio inicial, updateUser ya no acepta credenciales, handlers reales reemplazan lógica duplicada, y el panel verifica fallos de alta/edición/reset. Ante éxito del profesional y fallo de cuenta, informa resultado parcial, cierra y recarga para que el reintento se haga editando el registro persistido, sin crear otro profesional. Username exitoso se informa y la UI alinea clave temporal/email opcional.

Evidencia: 59 casos aislados ejecutados con exit 0 (8 persistencia, 4 provisión real, 5 perfil real, 5 login memoria, 17 reset/cambio atómico, 15 handler cambio, 5 sesión). TypeScript, build Vite, esbuild servidor y diff-check pasan. No PostgreSQL real, navegador, Render, Neon, datos ni red. No cerrar puntos 4–6: faltan protección concurrente del último superadmin, QA navegador/desplegado y evidencia PostgreSQL separada cuando exista.

BOOK-003 permanece después del cierre/integración de AUTH-002 y ya incluye código, clave, captura y enlace de cancelación seguro.
