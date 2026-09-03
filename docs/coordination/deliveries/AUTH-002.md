# Entrega de Tarea: AUTH-002 — Autenticación, Gestión de Cuentas, Persistencia de Sesión y Permisos del Catálogo de Beneficios

- **Rama:** `antigravity/AUTH-002-session-benefits`
- **Fecha:** 2026-09-02
- **Estado de la entrega:** `REVIEW` (pendiente de revisión, integración en `main` y validación en Render)
- **Modo de coordinación:** Manual (automatización con Codex pausada por decisión del propietario)

## Corrección posterior a revisión — 2026-09-03

### Protección concurrente del último superadmin

### Bootstrap PostgreSQL con conexión única

El bootstrap se ejecuta después de establecer el modo PostgreSQL y liberar el cliente de inicialización. `checkAndExecuteSuperadminBootstrap` obtiene su propio cliente y usa ese mismo cliente para BEGIN, advisory lock compartido, conteo de cualquier superadmin activo o inactivo, INSERT de usuario, INSERT de auditoría y COMMIT/ROLLBACK. Si existe cualquiera, no crea otro; si falla PostgreSQL, no continúa en memoria. No registra usuario, hash, salt ni contraseña. El modo memoria conserva el mutex previo.

Nueva suite `test_auth002_bootstrap_atomic.cjs`: 6 casos de control de flujo con conexión simulada, existencia previa, rollback de auditoría, fallo de conexión, configuración ausente y orden correcto desde initDatabase. Junto con las 66 anteriores: 72 casos aislados aprobados, tsc y diff-check exitosos. Sin PostgreSQL real ni QA desplegado.

`updateUser` ahora usa un único cliente PostgreSQL con BEGIN, advisory lock compartido con el dominio de bootstrap, fila objetivo FOR UPDATE, conteo autoritativo, UPDATE RETURNING y COMMIT/ROLLBACK/release. Si la mutación puede reducir superadmins activos, ninguna segunda operación concurrente puede aprobar basándose en una lectura anterior. PostgreSQL retorna directamente el resultado y no muta el fallback en memoria. El modo memoria serializa estas mutaciones con el mutex existente y revalida antes de mutar.

Nueva suite real extraída `test_auth002_superadmin_atomic.cjs`: 7 casos con SQL/memoria simulados; último activo rechazado, actualización con dos permitida, rollback, actualización no riesgosa, dos degradaciones simultáneas en memoria, rechazo del último y campos de credenciales. Todas las suites AUTH-002 suman 66 casos aislados aprobados; tsc y diff-check pasan. No acredita PostgreSQL real. El bootstrap con conexión única sigue pendiente y no fue modificado en este bloque.

Codex completó directamente las correcciones solicitadas después de que Antigravity CLI rechazara repetidamente lecturas ya autorizadas. No se desactivaron controles globales ni se usó `dangerously-skip-permissions`.

- POST `/api/users` impone `mustChangePassword: true` para toda cuenta creada administrativamente, aunque se envíe contraseña explícita o un flag falso.
- `updateUser` rechaza password, hash, salt y mustChangePassword; las credenciales quedan exclusivamente en los flujos atómicos dedicados.
- La administración de profesionales verifica todas las respuestas HTTP de alta/edición/reset de cuenta, informa éxito parcial con precisión y no recorta contraseñas.
- La UI aclara que la contraseña temporal es opcional si existe configuración privada, que el email no es obligatorio y muestra el username devuelto tras éxito.
- Se eliminaron aserciones sobre una copia manual del filtro. Nuevas suites extraen y ejecutan los handlers reales de POST/PUT de usuarios.

Evidencia local aislada: 8 persistencia, 4 provisión real, 5 perfil real, 5 login memoria, 17 reset/cambio atómico, 15 handler de cambio y 5 sesiones; todas exit 0. `tsc --noEmit`, Vite build, esbuild servidor y `git diff --check`: exit 0. No PostgreSQL, navegador, Render, Neon, datos ni red. El aviso de bundle >500 kB es no bloqueante y previo al alcance. Protección concurrente del último superadmin sigue pendiente; no declarar AUTH-002 cerrada.

---

## 1. Tarea que resuelve

La tarea **AUTH-002** aborda de forma integral la autenticación, la robustez frente a condiciones de carrera en login/reset, la gestión segura y provisión de cuentas de empleados, la interfaz de autogestión de credenciales ("Mi cuenta") y los permisos del catálogo de beneficios en Gwen Nails Studio.

Resuelve específicamente:
1. **Atomicidad y concurrencia login/reset:** Prevención de sesiones válidas creadas con credenciales anteriores frente a un reseteo concurrente (`authenticateAndCreateSession` con bloqueo pesimista `SELECT ... FOR UPDATE` en PostgreSQL y persistencia atómica en memoria).
2. **Protección de rutas alternativas:** Rechazo estricto de modificación de contraseñas u otros atributos protegidos mediante `PUT /api/users/:id`, obligando al uso de los flujos atómicos auditados (`/api/users/:id/reset-password`).
3. **Provisión de empleados:** Generación automática de nombres de usuario normalizados a partir del nombre y apellido (`generateProposedUsername`) con resolución de colisiones numéricas; email no obligatorio; clave temporal común provista de forma segura desde la variable de entorno privada `EMPLOYEE_DEFAULT_TEMP_PASSWORD` (sin credenciales fijas en el código); cambio de clave obligatorio en el primer ingreso (`mustChangePassword: true`); y rechazo de la clave temporal en cambios voluntarios.
4. **Apartado "Mi cuenta" en el panel administrativo:** Pestaña disponible para todos los roles autenticados (`superadmin`, `admin`, `profesional`, `empleado`) que muestra el perfil actual y permite el cambio voluntario de clave requiriendo contraseña actual, nueva contraseña con checklist dinámico de requisitos en verde, y confirmación con indicador de coincidencia.
5. **Catálogo de Tipos de Beneficio:** Distinción clara e inequívoca entre una lista vacía de plantillas (`"No hay tipos de beneficio cargados"`) y fallos reales de red, autorización o permisos (401/403/500).
6. **Compilación y pruebas:** Corrección limpia del error de tipado en `scripts/test_booking_concurrency.ts` sin silenciar aserciones, logrando `0` errores en `tsc --noEmit` y build de producción exitoso en Vite.

---

## 2. Resumen de cambios

### Backend y Base de Datos
1. **`src/server/db.ts`**:
   - Implementación de `authenticateAndCreateSession(identifier, password)`: ejecuta dentro de una transacción `BEGIN` ... `SELECT ... FOR UPDATE` ... `COMMIT` en PostgreSQL. Verifica credenciales y crea la sesión bajo el mismo cerrojo de fila. Si se ejecuta en modo fallback (memoria), escribe atómicamente a archivo temporal con `0o600` y renombre antes de publicar la sesión.
   - Implementación de `getEmployeeDefaultTempPassword()`: obtiene la clave temporal configurada en `process.env.EMPLOYEE_DEFAULT_TEMP_PASSWORD || process.env.EMPLOYEE_TEMP_PASSWORD`.
   - En `createUser`: soporta creación de empleados sin requerir email; si no se suministra contraseña, utiliza la clave temporal privada y activa `mustChangePassword = true`.
   - En `updateUser`: eliminación de lógica de persistencia de contraseñas y preservación del contrato seguro para campos de perfil.
   - En `changeUserCredentialAtomic`: validación que rechaza el cambio de contraseña si la nueva coincide con el nombre de usuario o con la clave temporal configurada en el entorno (`"La nueva contraseña no puede coincidir con la clave temporal."`).
   - Principio fail-closed: si PostgreSQL reporta error de conexión o consulta, no realiza fallback silencioso a memoria en operaciones de autenticación.

2. **`src/server/clientMatching.ts`**:
   - Implementación y exportación de `generateProposedUsername(nombre, apellido, existingUsernames)`: limpia acentos y caracteres especiales, compone inicial del primer nombre + apellido en minúsculas, y resuelve colisiones agregando sufijos numéricos incrementales (`gnails`, `gnails1`, `gnails2`).

3. **`server.ts`**:
   - En `POST /api/auth/login`: sustitución de llamada desacoplada por `authenticateAndCreateSession`.
   - En `PUT /api/users/:id`: agregado de guardián que rechaza con `400 Bad Request` si la solicitud incluye `password`, `passwordHash`, `salt` o `mustChangePassword`, devolviendo el mensaje `"No se permite modificar credenciales mediante edición genérica. Utilice el endpoint de restablecimiento /api/users/:id/reset-password."`. Sanitiza la lista de atributos permitidos (`nombre`, `rol`, `profesionalId`, `activo`, `username`, `email`).
   - En `POST /api/users`: generación automática de username si no se envía pero se especifica el nombre; uso de la clave temporal por defecto si no se envía contraseña; `email` pasa a ser opcional.
   - En `POST /api/users/:id/reset-password`: si se omite `newPassword`, utiliza la clave temporal por defecto del entorno.

### Frontend
4. **`src/components/AdminModal.tsx`**:
   - Incorporación de `'mi-cuenta'` al tipo unión de pestañas (`activeTab`).
   - Agregado del botón "Mi cuenta" en la barra de navegación del panel administrativo (visible para todos los roles).
   - Panel de "Mi cuenta": resumen de cuenta (nombre, usuario, email, rol) y formulario de cambio voluntario de clave requiriendo clave actual, nueva clave con validación visual reactiva mediante `passwordChecklist` (ítems pasan a verde `text-emerald-700` al cumplirse) y confirmación con indicador de coincidencia.

5. **`src/components/BenefitTemplatesAdmin.tsx`**:
   - En el estado vacío del catálogo, se actualizó el texto a `"No hay tipos de beneficio cargados"`, diferenciándolo de los mensajes de error de red o de acceso no autorizado (403).

6. **`src/components/ProfessionalManagementAdmin.tsx`**:
   - La asociación de cuenta de usuario ya no requiere obligatoriamente email.
   - Si se especifica una nueva contraseña al editar a un profesional existente, se envía mediante `POST /api/users/:id/reset-password` en lugar de adjuntarla a `PUT /api/users/:id`.

### Pruebas y Scripts
7. **`scripts/test_booking_concurrency.ts`**:
   - Se reemplazó `import fetch from 'node-fetch'` por `const fetch = globalThis.fetch` para aprovechar el runtime nativo de Node.js 18+ sin requerir módulos externos inexistentes en el entorno local.
8. **`scripts/test_auth002_full_suite.cjs`**:
   - Nueva suite de 19 aserciones que valida de forma aislada:
     - Generación de usernames y resolución de colisiones.
     - Operación de `authenticateAndCreateSession` (éxito, login por email, clave incorrecta, usuario inactivo, usuario inexistente).
     - Filtro de seguridad de `PUT /api/users/:id` frente a intentos de asignación masiva de credenciales.

---

## 3. Pruebas realmente ejecutadas y sus resultados

Se ejecutaron localmente todas las suites de prueba disponibles mediante Node.js v24.19.0:

| Suite / Verificación | Casos / Comando | Resultado | Observaciones |
|---|---|---|---|
| `test_atomic_admin_reset.cjs` | 17 casos | **PASS** | Transacciones de reseteo, auditoría, rollback y descarte de contraseñas |
| `test_password_change_context.cjs` | 15 casos | **PASS** | Handlers aislados de cambio de clave y sesiones |
| `test_session_fail_closed.cjs` | 5 casos | **PASS** | Validación de principio fail-closed sin fallback a memoria |
| `test_user_credential_persistence.cjs` | 8 casos | **PASS** | Creación y actualización de usuarios sin almacenar texto plano |
| `test_auth002_full_suite.cjs` | 19 casos | **PASS** | `authenticateAndCreateSession`, `PUT` guard, colisiones de username |
| **Total casos de prueba** | **64 casos** | **100% PASS** | Todas las suites aisladas pasaron en verde |
| Chequeo de tipos TypeScript | `tsc --noEmit` | **0 errores** | Compilación limpia de todo el repositorio |
| Compilación de producción | `vite build` | **Éxito (3.91s)** | Generación exitosa de `dist/index.html` y bundles JS/CSS |

---

## 4. Pruebas pendientes y motivos

- **Validación funcional y QA en entorno desplegado de Render (`https://gwenaistudio.onrender.com/`):**
  - **Motivo:** Conforme al protocolo del proyecto, la validación en Render se realiza una vez que los cambios son revisados e integrados en `main`, disparando el despliegue automático autorizado por el propietario.
  - **Escenarios a validar en Render tras el despliegue:**
    1. Login con cuenta de empleado recién creada (con username y clave temporal).
    2. Verificación de bloqueo de operaciones administrativas hasta que se complete el cambio forzado de clave.
    3. Validación del formulario voluntario de "Mi cuenta" para administradores y profesionales.
    4. Comprobación del catálogo de beneficios mostrando "No hay tipos de beneficio cargados" cuando no existen registros.
    5. Intento de modificación de contraseñas mediante llamadas directas de API a `PUT /api/users/:id` para confirmar respuesta 400.

---

## 5. Riesgos o decisiones tomadas

1. **Configuración de clave temporal (`EMPLOYEE_DEFAULT_TEMP_PASSWORD`):**
   - Se decidió no incluir ninguna contraseña por defecto en el código fuente versionado para respetar estrictamente las normas de seguridad.
   - En entornos de producción (Render) y desarrollo, se debe configurar la variable de entorno `EMPLOYEE_DEFAULT_TEMP_PASSWORD` o `EMPLOYEE_TEMP_PASSWORD` en el panel de configuración privada si se desea utilizar la provisión rápida de empleados.
2. **Revocación de sesiones en cambio voluntario de clave:**
   - Al realizar un cambio voluntario de clave desde la pestaña "Mi cuenta", el backend revoca atómicamente todas las sesiones activas del usuario por motivos de seguridad. La interfaz redirige al usuario para que ingrese con su nueva clave, informando claramente mediante una notificación en pantalla.
3. **Manejo de email para empleados:**
   - La base de datos y los endpoints ahora tratan el email como opcional para usuarios de rol empleado o profesional que operan exclusivamente mediante su nombre de usuario. No se inventan direcciones de correo sintéticas en el almacenamiento principal.
