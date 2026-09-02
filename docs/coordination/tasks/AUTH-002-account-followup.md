# AUTH-002: siguientes bloques de cuentas

Estado READY dentro del alcance aprobado. Base revisada: 645d9b0. No ejecutar estos bloques en paralelo sobre el mismo worktree.

## 1. Cambio de contraseña: validaciones contextuales

Hallazgo estático: POST /api/auth/password-change valida contraseña actual y política de complejidad, pero permite elegir nuevamente la contraseña actual. Además acepta valores truthy no string hasta llegar al hashing.

Primer pedido acotado: server.ts, solo ese endpoint. Exigir strings no vacíos sin transformarlos, rechazar nueva igual a actual y nueva igual al username normalizado en comparación sin distinción de mayúsculas. Conservar validación compartida, política de roles, mensajes sin credenciales, revocación y auditoría. No incorporar todavía secretos temporales ni crear cuentas. Verificar handler aislado con dependencias simuladas, sin importar server.ts/iniciar DB. Casos: payloads no string, actual errónea, clave igual a actual, igual a usuario, nueva válida y fallo de persistencia sin success.

## 2. Persistencia transaccional y resets

Antes de habilitar provisión genérica, revisar coordinación de cambio de hash, mustChangePassword, revocación y auditoría. Hoy updateUser, revokeAllUserSessions y createAuditLog son llamadas separadas: inspección estática no acredita atomicidad del conjunto ni protección frente a resets concurrentes. Diseñar una operación transaccional PostgreSQL en una sola conexión y equivalente en memoria; evitar reemplazos amplios de db.ts. Mantener protección del último superadmin y no modificar cuentas de testing existentes para implementar.

## 3. Provisión e interfaz

Usuario generado desde inicial+apellido con colisiones controladas; email de empleado opcional. Clave temporal genérica únicamente desde configuración privada, sin valor por defecto en código. Cambio obligatorio tras creación/reset; admin restablece olvidos. No activar nuevas variables ni mostrar secretos sin preparación del entorno. Mi cuenta solicita actual, nueva y confirmación con checklist compartido. No igualdad a temporal debe validarse del lado servidor sin revelar ese secreto al frontend.

## Coordinación CLI

Dos diagnósticos solo lectura terminaron con exit 0; segundo emitió marcador LECTURA_OK en evento result. El formato stream-json usa event/step_update/result (no type/message). No demuestra que toda invocación futura tenga permisos. El error previo no identificó ruta denegada: no ampliar permisos globales ni repetir pedidos ya resueltos. Si recurre, capturar solo nombre/ruta de herramienta desde step_update, sin contenido/secretos.
