import { CancellationNotificationData, ConfirmationNotificationData } from './types';
import { isoDateToAR } from '../../utils/dateUtils.js';

export interface EmailTemplateOptions {
  isTestEnv?: boolean;
  testDisclaimer?: string;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateConfirmationHtml(data: ConfirmationNotificationData): string {
  const fullName = escapeHtml(`${data.clienteNombre} ${data.clienteApellido || ''}`.trim());
  const professional = data.profesionalNombre
    ? `<p style="margin:4px 0"><strong>Profesional:</strong> ${escapeHtml(data.profesionalNombre)}</p>`
    : '';
  const price = data.precioFinal != null
    ? `<p style="margin:4px 0"><strong>Total:</strong> $${escapeHtml(data.precioFinal.toLocaleString('es-AR'))} ARS</p>`
    : '';
  return `<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#FAF7F2;color:#241E1A;font-family:Arial,sans-serif">
  <table role="presentation" width="100%" style="max-width:580px;margin:auto;background:#fff;border:1px solid #E8DCD5;border-radius:16px;overflow:hidden">
    <tr><td style="padding:28px;background:#8E4455;color:#fff;text-align:center"><h1 style="margin:0;font-size:23px">Gwen Nails</h1><p style="margin:6px 0 0">Tu turno está confirmado</p></td></tr>
    <tr><td style="padding:30px"><p>Hola <strong>${fullName}</strong> 💅</p><p>Registramos correctamente tu reserva.</p>
      <div style="padding:18px;background:#FDFBFA;border:1px solid #E8DCD5;border-radius:12px">
        <p style="margin:4px 0"><strong>Servicio:</strong> ${escapeHtml(data.servicioNombre)}</p>
        <p style="margin:4px 0"><strong>Fecha:</strong> ${escapeHtml(isoDateToAR(data.fecha))}</p>
        <p style="margin:4px 0"><strong>Horario:</strong> ${escapeHtml(data.horaInicio)} a ${escapeHtml(data.horaFin)} hs</p>${professional}${price}
      </div>
      <div style="margin-top:18px;padding:18px;background:#FFF9F6;border:2px dashed #E8B4B8;border-radius:12px">
        <p style="margin:4px 0"><strong>Código de reserva:</strong> <span style="font-family:monospace">${escapeHtml(data.codigo)}</span></p>
        <p style="margin:8px 0 4px"><strong>Clave de gestión:</strong> <span style="font-family:monospace;font-size:17px">${escapeHtml(data.managementKey)}</span></p>
        <p style="font-size:13px">Guardá estos datos o tomá una captura. Los necesitarás para gestionar o cancelar el turno.</p>
      </div>
      <p style="text-align:center;margin:24px 0 8px"><a href="${escapeHtml(data.managementUrl)}" style="display:inline-block;padding:12px 20px;border-radius:24px;background:#8E4455;color:#fff;text-decoration:none">Gestionar mi turno</a></p>
      <p style="font-size:12px;color:#7A6B62;text-align:center">El enlace abre una pantalla de gestión y nunca cancela el turno automáticamente.</p>
    </td></tr>
  </table></body></html>`;
}

export function generateConfirmationPlainText(data: ConfirmationNotificationData): string {
  return `Hola ${data.clienteNombre} ${data.clienteApellido || ''}\n\nTu turno en Gwen Nails está confirmado.\n\nServicio: ${data.servicioNombre}\nFecha: ${isoDateToAR(data.fecha)}\nHorario: ${data.horaInicio} a ${data.horaFin} hs${data.profesionalNombre ? `\nProfesional: ${data.profesionalNombre}` : ''}${data.precioFinal != null ? `\nTotal: $${data.precioFinal.toLocaleString('es-AR')} ARS` : ''}\n\nCódigo de reserva: ${data.codigo}\nClave de gestión: ${data.managementKey}\n\nGuardá estos datos o tomá una captura. Los necesitarás para gestionar o cancelar el turno.\n\nGestionar mi turno: ${data.managementUrl}\nEl enlace no cancela el turno automáticamente.\n\nGwen Nails`;
}

/**
 * Builds the formatted HTML template for appointment cancellation email
 */
export function generateCancellationHtml(
  data: CancellationNotificationData, 
  options?: EmailTemplateOptions
): string {
  const fullName = `${data.clienteNombre} ${data.clienteApellido || ''}`.trim();
  const fechaAR = isoDateToAR(data.fecha);
  const isTest = Boolean(options?.isTestEnv);
  const testDisclaimer = options?.testDisclaimer || 'Este mensaje fue generado desde el entorno de pruebas de Gwen Nails.';
  const testBannerHtml = isTest 
    ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #8C7A70; font-style: italic;">${testDisclaimer}</p>`
    : '';

  // If benefit compensation is attached
  if (data.beneficio) {
    const fechaVencAR = data.beneficio.fechaVencimiento ? isoDateToAR(data.beneficio.fechaVencimiento) : 'Sin fecha de vencimiento';
    const benefitTitle = data.beneficio.titulo;
    const benefitDesc = data.beneficio.descripcion ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #7A6B62;">${data.beneficio.descripcion}</p>` : '';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cancelación de Turno - Gwen Nails</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 24px; color: #241E1A;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E8DCD5; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <!-- Header -->
    <tr>
      <td style="background-color: #8E4455; padding: 28px 32px; text-align: center;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">Gwen Nails</h1>
        <p style="color: #F8D7DA; margin: 6px 0 0 0; font-size: 13px;">Aviso importante sobre tu turno</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px 32px 24px 32px;">
        <p style="font-size: 15px; margin: 0 0 16px 0; color: #241E1A;">
          Hola <strong>${fullName}</strong> 💅
        </p>
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; color: #5A4B43;">
          Tenemos que contarte que, por una eventualidad, no podremos atenderte en tu turno del <strong>${fechaAR} a las ${data.horaInicio}</strong>, por lo que debimos cancelarlo.
        </p>
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; color: #5A4B43;">
          Sabemos que organizaste tu tiempo para visitarnos y lamentamos mucho este inconveniente.
        </p>
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #5A4B43;">
          Por eso, queremos regalarte un beneficio exclusivo para tu próxima visita:
        </p>

        <!-- Benefit Snapshot Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FFF9F6; border: 2px dashed #E8B4B8; border-radius: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 18px; color: #8E4455; font-weight: 700;">
                🎁 ${benefitTitle}
              </p>
              ${benefitDesc}
              <p style="margin: 12px 0 0 0; font-size: 13px; color: #5A4B43;">
                Válido hasta: <strong>${fechaVencAR}</strong>
              </p>
            </td>
          </tr>
        </table>

        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; color: #5A4B43;">
          Gracias por tu comprensión y por elegirnos. Esperamos volver a encontrarnos muy pronto. 💕
        </p>
        <p style="font-size: 15px; font-weight: 700; margin: 20px 0 0 0; color: #8E4455;">
          Gwen Nails
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #FAF7F2; padding: 20px 32px; border-top: 1px solid #E8DCD5; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #8C7A70;">
          Gwen Nails · Nails & Beauty Studio
        </p>
        ${testBannerHtml}
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  const profText = data.profesionalNombre ? `<p style="margin: 4px 0; color: #5A4B43;"><strong>Profesional:</strong> ${data.profesionalNombre}</p>` : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cancelación de Turno - Gwen Nails</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 24px; color: #241E1A;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E8DCD5; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <!-- Header -->
    <tr>
      <td style="background-color: #8E4455; padding: 28px 32px; text-align: center;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">Gwen Nails</h1>
        <p style="color: #F8D7DA; margin: 6px 0 0 0; font-size: 13px;">Aviso importante sobre tu turno</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px 32px 24px 32px;">
        <p style="font-size: 15px; margin: 0 0 16px 0; color: #241E1A;">
          Hola <strong>${fullName}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #5A4B43;">
          Te informamos que tu turno ha sido <strong>cancelado</strong>. A continuación te dejamos los detalles correspondientes:
        </p>

        <!-- Details Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FDFBFA; border: 1px solid #E8DCD5; border-radius: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #8C7A70; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Detalle del Turno</p>
              <p style="margin: 4px 0; color: #5A4B43; font-size: 14px;"><strong>Código de Reserva:</strong> <span style="font-family: monospace; font-size: 15px; font-weight: 700; color: #8E4455;">${data.codigo}</span></p>
              <p style="margin: 4px 0; color: #5A4B43; font-size: 14px;"><strong>Servicio:</strong> ${data.servicioNombre}</p>
              <p style="margin: 4px 0; color: #5A4B43; font-size: 14px;"><strong>Fecha:</strong> ${fechaAR}</p>
              <p style="margin: 4px 0; color: #5A4B43; font-size: 14px;"><strong>Horario:</strong> ${data.horaInicio} a ${data.horaFin} hs</p>
              ${profText}
            </td>
          </tr>
        </table>

        <!-- Reason Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FFF5F5; border: 1px solid #FED7D7; border-radius: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px 20px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #9B2C2C; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Motivo de la Cancelación:</p>
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #742A2A;">
                ${data.motivoCancelacion || 'Cancelado por el salón'}
              </p>
            </td>
          </tr>
        </table>

        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; color: #5A4B43;">
          Lamentamos cualquier inconveniente que esto pueda causarte. Podés ingresar a nuestra plataforma para seleccionar un nuevo horario disponible o responder a este correo para coordinar una nueva fecha.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #FAF7F2; padding: 20px 32px; border-top: 1px solid #E8DCD5; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #8C7A70;">
          Gwen Nails · Nails & Beauty Studio
        </p>
        ${testBannerHtml}
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates a plain-text version for email clients without HTML support
 */
export function generateCancellationPlainText(
  data: CancellationNotificationData,
  options?: EmailTemplateOptions
): string {
  const fullName = `${data.clienteNombre} ${data.clienteApellido || ''}`.trim();
  const fechaAR = isoDateToAR(data.fecha);
  const isTest = Boolean(options?.isTestEnv);
  const testDisclaimer = options?.testDisclaimer || 'Este mensaje fue generado desde el entorno de pruebas de Gwen Nails.';
  const testSuffix = isTest ? `\n\n${testDisclaimer}` : '';

  if (data.beneficio) {
    const fechaVencAR = data.beneficio.fechaVencimiento ? isoDateToAR(data.beneficio.fechaVencimiento) : 'Sin fecha de vencimiento';
    const benefitTitle = data.beneficio.titulo;
    const benefitDesc = data.beneficio.descripcion ? `\n${data.beneficio.descripcion}` : '';

    return `
Hola ${fullName} 💅

Tenemos que contarte que, por una eventualidad, no podremos atenderte en tu turno del ${fechaAR} a las ${data.horaInicio}, por lo que debimos cancelarlo.

Sabemos que organizaste tu tiempo para visitarnos y lamentamos mucho este inconveniente.

Por eso, queremos regalarte un beneficio exclusivo para tu próxima visita:

🎁 ${benefitTitle}${benefitDesc}

Válido hasta: ${fechaVencAR}

Gracias por tu comprensión y por elegirnos. Esperamos volver a encontrarnos muy pronto. 💕

Gwen Nails${testSuffix}
    `.trim();
  }

  return `
Hola ${fullName},

Te informamos que tu turno ha sido CANCELADO.

Detalles del Turno:
- Código de Reserva: ${data.codigo}
- Servicio: ${data.servicioNombre}
- Fecha: ${fechaAR}
- Horario: ${data.horaInicio} a ${data.horaFin} hs
${data.profesionalNombre ? `- Profesional: ${data.profesionalNombre}\n` : ''}
Motivo de Cancelación:
${data.motivoCancelacion || 'Cancelado por el salón'}

Lamentamos cualquier inconveniente. Podés ingresar a nuestro sitio para agendar un nuevo horario o contactarnos.

Gwen Nails · Nails & Beauty Studio${testSuffix}
  `.trim();
}
