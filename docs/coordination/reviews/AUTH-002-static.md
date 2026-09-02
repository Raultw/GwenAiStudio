# AUTH-002 — Revisión del diagnóstico

2026-09-02. Aprobada implementación acotada a AdminModal y BenefitTemplatesAdmin: flujo de contraseña obligatoria, permisos de catálogo, forma de respuesta inválida como error explícito, manejo de 403 y cancelación/versionado de respuestas obsoletas. No cambios de backend ni reglas de descuento.

Correcciones al diagnóstico: strings sí poseen slice y toLocaleString; no afirmar excepción para todo no-numérico. El formulario de login inicial está oculto durante isCheckingAuth, por lo que la carrera de login inicial propuesta no está reproducida. Cierre/reapertura y transiciones requieren pruebas dirigidas. Rechazar valores inválidos en catálogo, no sustituirlos por descuentos cero ni listas vacías.

QA base real ya pasó; esta remediación atiende casos adicionales y no demuestra la causa de los errores históricos. Endpoint público de turnos mencionado en diagnóstico: requiere auditoría de exposición y dependencias del flujo público por separado, sin descargar datos masivamente ni bloquear endpoints públicos arbitrariamente.
