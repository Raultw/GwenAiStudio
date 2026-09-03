const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const projectRoot = path.resolve(__dirname, '..');
const source = path.join(projectRoot, 'src/server/bookingManagement.ts');
const output = path.join(projectRoot, 'node_modules/.cache/booking-management-test.cjs');

esbuild.buildSync({ entryPoints: [source], outfile: output, bundle: true, platform: 'node', format: 'cjs' });
const { randomManagementKey, hashManagementKey, verifyManagementKey, randomBookingCode, isBookingCodeCollision } = require(output);

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const keys = new Set(Array.from({ length: 200 }, () => randomManagementKey()));
assert(keys.size === 200, 'Las claves deben ser únicas en la muestra.');
assert([...keys].every(key => /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{10}$/.test(key)), 'Formato de clave inválido.');

const appointmentId = 'apt-test-1';
const key = randomManagementKey();
const hash = hashManagementKey(appointmentId, key);
assert(!hash.includes(key), 'El hash no debe contener la clave.');
assert(verifyManagementKey(appointmentId, key, hash), 'La clave correcta debe verificar.');
assert(!verifyManagementKey(appointmentId, `${key}X`, hash), 'Una clave incorrecta no debe verificar.');
assert(!verifyManagementKey('apt-other', key, hash), 'El hash debe estar ligado al turno.');

const codes = new Set(Array.from({ length: 200 }, () => randomBookingCode()));
assert(codes.size === 200, 'Los códigos deben ser únicos en la muestra.');
assert([...codes].every(code => /^GWEN-[0-9A-F]{10}$/.test(code)), 'Formato de código inválido.');
assert(isBookingCodeCollision({ code: '23505', constraint: 'appointments_codigo_key' }), 'Debe reconocer colisión SQL de código.');
assert(!isBookingCodeCollision({ code: '23505', constraint: 'idx_appointments_unique_slot' }), 'No debe confundir una colisión de horario.');

fs.rmSync(output, { force: true });
console.log('BOOK-003 gestión: 10 comprobaciones aprobadas.');
