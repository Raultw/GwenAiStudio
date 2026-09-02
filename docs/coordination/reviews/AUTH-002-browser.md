# AUTH-002 — Verificación real en navegador

2026-09-02, Render, Chrome headless aislado, viewport 1440x1000. Credenciales leídas fuera del repositorio; no se guardaron cookies, capturas ni trazas con secretos.

- Primera navegación: timeout antes de login; no atribuible a sesión sin evidencia.
- Reintento: login 200, catálogo visible, recarga completa y reapertura del panel conservan autenticación; auth/me 200. Cookie HttpOnly, Secure, SameSite=Lax, de sesión.
- Segunda ejecución: repitió lo anterior y creó desde UI una plantilla QA identificada (201), visible inmediatamente. Desactivación posterior por API 200, sin borrado físico. Logout de sesión de prueba ejecutado; navegador aislado cerrado, no navegador personal.

No se reprodujeron los errores históricos con la cuenta recuperada. No se acredita versión desplegada por SHA, no hay cambios de aplicación atribuidos a esta prueba. No cubre permisos de otros roles, errores simulados, sesión expirada, cierre/restauración del navegador ni todos los tamaños de pantalla. Antigravity revisa esos casos para proponer correcciones focalizadas, sin cambios especulativos.
