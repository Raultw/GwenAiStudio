# Informe de Revisión Focalizada: AUTH-002
**Proyecto:** Gwen Nails Studio — Sistema de Gestión y Catálogo de Beneficios  
**Fase:** Diagnóstico y Análisis Técnico Previo a Modificación de Código  
**Fecha de Análisis:** 02 de Septiembre de 2026  
**Estado:** Listo para revisión del Coordinador (Sin cambios de código aplicados)

---

## 1. Contexto y Estado General

El coordinador verificó satisfactoriamente en entorno real de Render (Chrome) las siguientes operaciones base:
- Login exitoso de cuenta `superadmin` con código HTTP 200.
- Renderizado correcto del catálogo de plantillas de beneficios.
- Persistencia de sesión tras recarga de página y reapertura del panel modal vía cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
- Endpoint `GET /api/auth/me` respondiendo 200 OK.
- Creación de nueva plantilla de beneficios vía UI con código HTTP 201 y visualización inmediata.
- Conmutación de estado (activación/desactivación) con código HTTP 200.
- Los problemas históricos reportados con cuentas anteriores no se reprodujeron en la cuenta limpia.

> [!NOTE]
> En estricto cumplimiento de las directivas, **no se atribuyen estas soluciones al agente ni se han aplicado modificaciones al código fuente en esta entrega**. Este informe presenta el análisis estático focalizado sobre los 4 archivos habilitados (`src/components/AdminModal.tsx`, `src/components/BenefitTemplatesAdmin.tsx`, `src/server/authMiddleware.ts` y `server.ts`) para identificar riesgos de borde, inconsistencias y fallas latentes antes de cualquier intervención.

---

## 2. Matriz Ejecutiva de Hallazgos

| Eje Evaluado | Estado | Criticidad | Archivo / Líneas | Resumen del Hallazgo |
| :--- | :--- | :--- | :--- | :--- |
| **1. Sesión ausente / expirada** | Confirmado por código | Media | [`server.ts`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/server.ts#L174) / [`AdminModal.tsx`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/AdminModal.tsx#L348-L351) | Endpoints de carga inicial (`/api/turnos`, `/api/servicios`, etc.) carecen de `requireAuth`; solo `/api/benefit-templates` y endpoints mutantes lo exigen. La UI gestiona el 401 reactivamente pero con inconsistencia de cobertura. |
| **2. Flujo `mustChangePassword`** | Confirmado por código | Alta | [`AdminModal.tsx`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/AdminModal.tsx#L309) / [`authMiddleware.ts`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/server/authMiddleware.ts#L49-L60) | El backend bloquea correctamente (403 `MUST_CHANGE_PASSWORD`), pero el frontend no implementa formulario ni vista para que el usuario complete el cambio obligatorio de contraseña temporal. |
| **3. Rol `profesional` vs. `admin`/`superadmin`** | Confirmado por código | Media | [`AdminModal.tsx`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/AdminModal.tsx#L938-L1070) / [`server.ts`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/server.ts#L2195) | La barra de pestañas no filtra por rol; un usuario `profesional` ve la pestaña "Tipos de Beneficio", pero al entrar recibe error 403 continuo en `BenefitTemplatesAdmin` sin explicación contextual de permisos. |
| **4. Errores de red / JSON corrupto** | Confirmado por código (Borde) | Baja-Media | [`BenefitTemplatesAdmin.tsx`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/BenefitTemplatesAdmin.tsx#L101-L104) | Si el catálogo devuelve elementos con `nombrePublico` o `valorDescuento` nulos o no-string, el filtro y el formateador `.toLocaleString()` producen `TypeError` en el render de React. |
| **5. Condición de carrera (Race Condition)** | Confirmado por código | Media-Alta | [`AdminModal.tsx`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/AdminModal.tsx#L366-L397) | `fetch('/api/auth/me')` al montar el modal no tiene `AbortController` ni token de secuencia. Una respuesta lenta de `/api/auth/me` puede resolver tras un login o logout manual, desincronizando el estado. |

---

## 3. Análisis Técnico Detallado por Eje

### 3.1. Eje 1: Sesión Ausente o Expirada

#### Diagnóstico por Lectura de Código:
1. **Limpieza de Cookies en Backend:** En [`authMiddleware.ts:L42`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/server/authMiddleware.ts#L42), al detectar un token inválido o expirado, se ejecuta `res.clearCookie(SESSION_COOKIE_NAME, { path: '/' })` y se responde con código HTTP 401 y `code: 'INVALID_SESSION'`.
2. **Recepción en Frontend:**
   - En [`BenefitTemplatesAdmin.tsx:L74-L77`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/BenefitTemplatesAdmin.tsx#L74-L77), [`L136-L139`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/BenefitTemplatesAdmin.tsx#L136-L139) y [`L272-L275`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/BenefitTemplatesAdmin.tsx#L272-L275), el componente comprueba `if (res.status === 401)` y dispara `onAuthError?.()`.
   - En [`AdminModal.tsx:L331-L334`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/AdminModal.tsx#L331-L334), `handleAuthError` establece `setIsAuthenticated(false)` y `setCurrentUser(null)`.
3. **Inconsistencia Detectada en `loadAdminData`:**
   - En [`AdminModal.tsx:L348-L351`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/AdminModal.tsx#L348-L351):
     ```typescript
     if (aptRes.status === 401 || srvRes.status === 401 || profRes.status === 401) {
       handleAuthError();
       return;
     }
     ```
   - Sin embargo, en [`server.ts`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/server.ts), los endpoints `GET /api/turnos` ([L499](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/server.ts#L499)), `GET /api/servicios` ([L174](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/server.ts#L174)) y `GET /api/profesionales` ([L1041](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/server.ts#L1041)) son públicos y nunca devuelven 401.
   - Si la cookie expira en segundo plano mientras el admin navega la agenda, `loadAdminData` no se entera de la expiración hasta que el usuario intenta interactuar con un endpoint protegido (como `GET /api/benefit-templates` o `PUT /api/config`).

#### Propuesta de Mínima Corrección:
- Mantener la verificación periódica de `/api/auth/me` o incluir `requireAuth` en endpoints administrativos de lectura según la arquitectura deseada.
- En `loadAdminData`, incluir una llamada explícita a `/api/auth/me` o verificar el estado de autenticación de forma centralizada.

---

### 3.2. Eje 2: Flujo `mustChangePassword`

#### Diagnóstico por Lectura de Código:
1. **Comportamiento en Backend:**
   - En [`authMiddleware.ts:L49-L60`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/server/authMiddleware.ts#L49-L60):
     ```typescript
     if (result.user.mustChangePassword) {
       const allowedPaths = ['/api/auth/me', '/api/auth/password-change', '/api/auth/logout'];
       const reqPath = req.path || (req.url ? req.url.split('?')[0] : '');
       const isAllowed = allowedPaths.some(p => reqPath.endsWith(p));
       if (!isAllowed) {
         return res.status(403).json({
           error: 'Debe cambiar su contraseña temporal antes de continuar.',
           code: 'MUST_CHANGE_PASSWORD',
           mustChangePassword: true
         });
       }
     }
     ```
   - Cuando un usuario recién creado o con reseteo de clave inicia sesión, `result.user.mustChangePassword` es `true`.
   - `GET /api/auth/me` responde 200 con `user.mustChangePassword = true`.
   - Cualquier otra petición (como listar plantillas de beneficio `GET /api/benefit-templates`) responde `403 Forbidden` (`MUST_CHANGE_PASSWORD`).
2. **Carencia en Frontend (`AdminModal.tsx`):**
   - En [`AdminModal.tsx:L309-L312`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/AdminModal.tsx#L309-L312), tras un login exitoso, se ejecuta `setIsAuthenticated(true); setCurrentUser(data.user); loadAdminData();`.
   - No existe ninguna condición `if (currentUser?.mustChangePassword)` en el render de `AdminModal.tsx`.
   - No hay ningún modal ni formulario que invoque `POST /api/auth/password-change` ([`server.ts:L1224`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/server.ts#L1224)).
   - **Resultado:** El usuario queda autenticado en el panel, pero todas las secciones operativas devuelven errores 403 genéricos y el usuario no tiene ninguna forma gráfica de cambiar su contraseña para desbloquear su cuenta.
3. **Detalle en `POST /api/auth/password-change`:**
   - En [`server.ts:L1254`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/server.ts#L1254), se invoca `revokeAllUserSessions(userId)`. Esto invalida la sesión activa actual, por lo que tras el cambio de clave el frontend debe redirigir al login o solicitar reingreso de credenciales.

#### Propuesta de Mínima Corrección:
- En `AdminModal.tsx`, si `currentUser?.mustChangePassword === true`, desplegar una vista modal prioritaria de "Cambio Obligatorio de Contraseña" solicitando `currentPassword` y `newPassword`, llamando a `/api/auth/password-change` y guiando al usuario a reingresar con su nueva clave.

---

### 3.3. Eje 3: Rol `profesional` frente a `admin` / `superadmin`

#### Diagnóstico por Lectura de Código:
1. **Control de Acceso en Backend:**
   - En [`server.ts:L2195`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/server.ts#L2195), `GET /api/benefit-templates` aplica `requireAuth, requireAdmin`.
   - En [`authMiddleware.ts:L135`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/server/authMiddleware.ts#L135), `requireAdmin = requireRole(['superadmin', 'admin'])`.
   - Si un usuario con rol `profesional` o `empleado` intenta acceder a `/api/benefit-templates`, el middleware responde con código 403:
     `{ error: 'Acceso denegado. Permisos insuficientes...', code: 'FORBIDDEN' }`.
2. **Inconsistencia de Render en Frontend:**
   - En [`AdminModal.tsx:L1024-L1034`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/AdminModal.tsx#L1024-L1034), la pestaña "Tipos de Beneficio" se muestra sin comprobar si `currentUser?.rol === 'admin' || currentUser?.rol === 'superadmin'`.
   - Al hacer clic en la pestaña, `BenefitTemplatesAdmin` intenta cargar los datos y el backend devuelve 403.
   - En [`BenefitTemplatesAdmin.tsx:L78-L81`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/BenefitTemplatesAdmin.tsx#L78-L81), como el estado no es 401 (es 403), no se desloguea, sino que se muestra la tarjeta roja de error con el mensaje de permisos insuficientes y un botón "Reintentar" inútil.
3. **Otras Secciones Afectadas:**
   - Usuarios (`/api/users`), Promociones y Configuración del Salón también tienen restricciones de rol que no se reflejan condicionalmente en la barra de navegación del modal.

#### Propuesta de Mínima Corrección:
- Condicionar la visibilidad de la pestaña "Tipos de Beneficio" (y componentes de administración de usuarios/configuración) a roles autorizados:
  ```typescript
  const isAdmin = currentUser?.rol === 'superadmin' || currentUser?.rol === 'admin';
  ```
- Si un usuario no administrador ingresa directamente, renderizar un mensaje claro de "Vista restringida a administradores" en lugar de un error de carga fallida.

---

### 3.4. Eje 4: Errores de Red y Formato JSON Inesperado del Catálogo

#### Diagnóstico por Lectura de Código:
1. **Resiliencia ante Fallos de Conexión y Respuestas No-JSON (HTML 502/504):**
   - En [`BenefitTemplatesAdmin.tsx:L79`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/BenefitTemplatesAdmin.tsx#L79):
     `const errData = await res.json().catch(() => ({}));`
     Esto maneja adecuadamente los casos donde el servidor web o el proxy de Render devuelven páginas HTML de error en lugar de JSON.
   - En [`BenefitTemplatesAdmin.tsx:L83`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/BenefitTemplatesAdmin.tsx#L83):
     `setTemplates(Array.isArray(data) ? data : []);`
     Protege contra respuestas que no sean arreglos.
2. **Vulnerabilidades de Tipado en Tiempo de Ejecución (Edge Cases Confirmados por Lectura):**
   - **Búsqueda/Filtro ([`BenefitTemplatesAdmin.tsx:L102-L104`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/BenefitTemplatesAdmin.tsx#L102-L104)):**
     ```typescript
     tpl.nombrePublico.toLowerCase().includes(q)
     ```
     Si por migración o inconsistencia en BD un registro contiene `nombrePublico: null | undefined`, invocará `toLowerCase()` sobre `undefined` lanzando un `TypeError` no controlado que desmontará el componente React.
   - **Formateo de Valores ([`BenefitTemplatesAdmin.tsx:L567`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/BenefitTemplatesAdmin.tsx#L567)):**
     ```typescript
     ${tpl.valorDescuento.toLocaleString('es-AR')} OFF
     ```
     Si `valorDescuento` es nulo o no numérico, `toLocaleString()` lanzará excepción en el render.
   - **Servicios Aplicables ([`BenefitTemplatesAdmin.tsx:L543`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/BenefitTemplatesAdmin.tsx#L543), [`L633`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/BenefitTemplatesAdmin.tsx#L633)):**
     Si `tpl.serviciosAplicables` viniera como string en lugar de array (por ejemplo si la base de datos devuelve un JSON sin parsear), `tpl.serviciosAplicables.slice()` fallará.

#### Propuesta de Mínima Corrección:
- Aplicar lecturas seguras con operadores de encadenamiento opcional y coalescencia nula:
  - `(tpl.nombrePublico || '').toLowerCase().includes(q)`
  - `(Number(tpl.valorDescuento) || 0).toLocaleString('es-AR')`
  - `Array.isArray(tpl.serviciosAplicables) ? tpl.serviciosAplicables : []`

---

### 3.5. Eje 5: Carrera de Respuestas (Race Conditions) entre `auth/me`, `login` y `logout`

#### Diagnóstico por Lectura de Código:
1. **Escenario de Carrera en Montaje / Apertura (`isOpen`):**
   - En [`AdminModal.tsx:L366-L397`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/AdminModal.tsx#L366-L397):
     ```typescript
     useEffect(() => {
       if (isOpen) {
         setStatusFilter('pendiente');
         setDateFilter(getTodayDateString());
         setSearchQuery('');
         setIsCheckingAuth(true);
         // Check existing backend session cookie
         fetch('/api/auth/me', { credentials: 'include' })
           .then(async res => {
             if (res.ok) {
               const data = await res.json();
               if (data?.user) {
                 setIsAuthenticated(true);
                 setCurrentUser(data.user);
               } else {
                 setIsAuthenticated(false);
                 setCurrentUser(null);
               }
             } else {
               setIsAuthenticated(false);
               setCurrentUser(null);
             }
           })
           .catch(() => {
             setIsAuthenticated(false);
             setCurrentUser(null);
           })
           .finally(() => {
             setIsCheckingAuth(false);
           });
       }
     }, [isOpen]);
     ```
2. **Secuencias Críticas Identificadas:**
   - **Caso A (Login rápido durante verificación lenta):** Si la petición `/api/auth/me` (Petición A) sufre latencia y el usuario completa y envía rápidamente el formulario de login `handleLoginSubmit` (Petición B):
     1. Petición B responde 200: autentica al usuario y ejecuta `loadAdminData()`.
     2. Petición A responde posteriormente con 401 (porque al momento en que salió la cookie no existía o era vieja).
     3. El bloque `.then()` de la Petición A ejecuta `setIsAuthenticated(false)` y `setCurrentUser(null)`.
     4. **Efecto:** El usuario es expulsado inmediatamente tras haber iniciado sesión con éxito.
   - **Caso B (Logout inmediato tras apertura):** Si el usuario hace clic en "Salir" (`handleLogout`, [`L321-L329`](file:///C:/Users/ivanp/.codex/.chatgpt-projects/g-p-6a92fd78b82481918fecb9e173ef7c01/auth002-agent/src/components/AdminModal.tsx#L321-L329)), `setIsAuthenticated(false)` se ejecuta en el cliente. Si existía una petición de `loadAdminData` o `/api/auth/me` rezagada, su resolución posterior puede reactivar el estado o intentar actualizar componentes desmontados.
   - **Caso C (Cierre y reapertura rápida del modal):** Cada cambio de `isOpen` dispara una nueva promesa sin cancelar la anterior mediante `AbortController`.

#### Propuesta de Mínima Corrección:
- Implementar un `AbortController` o referencia de cancelación (`let isCurrent = true; return () => { isCurrent = false; }`) en el `useEffect` de verificación de sesión de `AdminModal.tsx`.
- En `handleLoginSubmit`, evitar que callbacks previos de `/api/auth/me` puedan alterar el estado una vez iniciado el proceso de autenticación.

---

## 4. Plan de Remediación Mínima Propuesto

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                      PROPUESTAS DE AJUSTES QUIRÚRGICOS                            │
│           (A la espera de autorización formal antes de modificar código)         │
└───────────────────────────────────────────────────────────────────────────────────┘
```

1. **`src/components/AdminModal.tsx`:**
   - Agregar control de cancelación (`AbortController`) en `useEffect([isOpen])` para neutralizar carreras entre `/api/auth/me` y el login manual.
   - Filtrar la pestaña `plantillas-beneficios` para que solo se renderice si `currentUser?.rol === 'admin' || currentUser?.rol === 'superadmin'`.
   - Incorporar subvista/modal de cambio obligatorio de contraseña cuando `currentUser?.mustChangePassword === true`.

2. **`src/components/BenefitTemplatesAdmin.tsx`:**
   - Asegurar defensas contra nulos (`(tpl.nombrePublico || '')`, `Number(tpl.valorDescuento) || 0`, `Array.isArray(tpl.serviciosAplicables)`).
   - Manejar explícitamente el error 403 (`FORBIDDEN` / `MUST_CHANGE_PASSWORD`) con un mensaje amigable contextualizado al rol en lugar del error genérico con botón de reintento.

3. **`src/server/authMiddleware.ts` y `server.ts`:**
   - Mantener intactas las reglas de negocio de descuentos y validación estricta No-Stacking.
   - Preservar la política de cookies `HttpOnly`, `Secure` y `SameSite=Lax`.

---

## 5. Plan de Pruebas y Validación por Hallazgo

Una vez autorizada la fase de implementación, se propone el siguiente protocolo de verificación:

| ID Prueba | Escenario de Prueba | Resultado Esperado |
| :--- | :--- | :--- |
| **TC-01** | Inicio de sesión con usuario que tenga `mustChangePassword: true`. | El sistema muestra inmediatamente el formulario de cambio de clave; no permite navegar a plantillas ni agenda hasta completarlo. Tras cambiar la clave, solicita nuevo login y el acceso queda 100% operativo. |
| **TC-02** | Inicio de sesión con usuario rol `profesional`. | La pestaña "Tipos de Beneficio" no se muestra en el menú o muestra advertencia de permisos sin arrojar errores no capturados ni loops de reintento. |
| **TC-03** | Simulación de expiración de cookie o 401 durante el uso del catálogo. | `BenefitTemplatesAdmin` captura el 401, invoca `onAuthError` y `AdminModal` transiciona suavemente a la pantalla de login sin errores de consola. |
| **TC-04** | Simulación de alta latencia de red en `/api/auth/me` + login simultáneo. | La resolución tardía de `/api/auth/me` es ignorada y no invalida el login exitoso recién completado. |
| **TC-05** | Carga de plantilla con campos incompletos o tipos inesperados desde BD. | El catálogo y los filtros de búsqueda renderizan sin lanzar excepciones `TypeError`. |

---
*Fin del informe de revisión focalizada AUTH-002.*
