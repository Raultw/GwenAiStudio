# AUTH-002 — Protección concurrente del último superadmin

Fecha 2026-09-03. Commit `1def4ab`. Estado: alcance **APROBADO**, AUTH-002 continúa REVIEW.

Antigravity superó las solicitudes de permisos al limitarse a archivos, pero agotó cinco minutos leyendo db.ts y dejó una edición truncada que eliminaba funciones. Codex detectó el daño antes de probar/publicar, restauró exactamente el archivo a 3026891 y realizó la corrección focalizada.

updateUser serializa en PostgreSQL las mutaciones que reducen superadmins con una conexión, transacción, advisory lock, SELECT objetivo FOR UPDATE, COUNT y UPDATE RETURNING. No usa pool.query dentro de esa transacción ni actualiza memoria después de PostgreSQL. Memoria comparte mutex y revalida antes de mutar.

Evidencia: nueva suite 7 casos y las 59 pruebas AUTH-002 anteriores pasan (66 total); tsc y diff-check pasan. SQL simulado, sin PostgreSQL, datos, disco o red. Bootstrap todavía usa conexiones separadas y queda como siguiente corrección. No integrado/desplegado.

Permisos: las interrupciones de autorización se evitaron al prohibir terminal y separar pruebas/Git a Codex. El problema de solicitudes repetidas está mitigado para este flujo, no resuelto globalmente; Antigravity aún mostró ineficiencia/timeout y edición incompleta. No usar permisos generales.
