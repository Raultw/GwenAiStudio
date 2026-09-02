# AUTH-002 — Diseño acotado de cambio/reset transaccional

Base inspeccionada: 6df6715. Diseño pendiente de implementación y pruebas. No invocar Antigravity mientras siga el bloqueo de autorización externa.

## Evidencia del código actual

- server.ts password-change llama updateUser, revokeAllUserSessions y createAuditLog por separado.
- adminResetPassword cambia hash/mustChangePassword y audita, pero no llama revocación de sesiones.
- createAuditLog y revokeAllUserSessions capturan fallos SQL y continúan en memoria. No garantizan que el cliente reciba error cuando esas operaciones fallan.
- saveLocalFileDb captura fallos de escritura, por lo que no sirve como persistencia estricta para una operación que prometa rollback.
- createSession persiste separadamente de authenticateUser: una verificación antigua podría competir con reset y crear una sesión después de revocar las anteriores. Un bloqueo solo en cambio de contraseña no resuelve esa carrera.

## Implementación propuesta por bloques

1. Crear operación interna de cambio de credencial con opciones explícitas self-change/admin-reset, sin mass assignment. PostgreSQL: una conexión; BEGIN; bloqueo de usuario SELECT FOR UPDATE; verificación de estado, contraseña actual cuando corresponda y reglas contextuales; actualización hash/salt/mustChangePassword; revocación de sesiones; inserción de auditoría; COMMIT; finally release. Cada fallo hace rollback y propaga error genérico. No usar helpers que abran otras conexiones o silencien errores.
2. Memoria: bloqueo compartido para las operaciones de autenticación relevantes; preparar copia de usuarios/sesiones/auditoría; persistencia estricta a temporal y reemplazo, publicando estado solo al confirmar guardado. Limitar el escritor nuevo a este flujo; no modificar masivamente todos los repositorios. Probar fallo de guardado antes de afirmar rollback.
3. Encadenar emisión de sesión con autenticación usando el mismo bloqueo de usuario o una versión de credencial verificada antes de insertar sesión. Elegir sin migración si puede garantizarse transacción única; si se requiere columna, preparar migración aditiva y revisión antes de ejecutar.
4. Reutilizar operación desde password-change y reset administrativo. Solo entonces incorporar clave temporal desde entorno privado, con cambio obligatorio. Revisar también PUT de usuarios para que no pueda modificar credenciales por una ruta paralela que omita revocación/auditoría.

## Puertas de QA

Pruebas aisladas: fallo en cada escritura no permite éxito parcial; revocación en self-change/reset; auditar una vez; ninguna contraseña en registros/logs; no reactivar usuarios ni cambiar roles. PostgreSQL aislado requerido para competencia cambio/reset/login: no afirmar concurrencia por mocks. Pruebas de memoria deben incluir snapshot y disco temporal fuera de datos del proyecto. Mantener credenciales existentes del propietario intactas.

Esta tarea no está completada y no convierte las pruebas anteriores de handler en garantías transaccionales.
