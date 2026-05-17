const BRAND_COLOR = '#5C1A1B';
const ACCENT_COLOR = '#A8794A';

function header() {
  return `
    <div style="background:${BRAND_COLOR};padding:32px 40px;text-align:center;">
      <p style="margin:0;color:#F2E8D5;font-family:Georgia,serif;font-size:22px;letter-spacing:0.08em;">
        BODEGAS MONASTERIO
      </p>
      <p style="margin:4px 0 0;color:#c9a87c;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.12em;">
        VITICULTORES Y COCINEROS DESDE 1949
      </p>
    </div>`;
}

function footer() {
  return `
    <div style="background:#F2E8D5;padding:24px 40px;text-align:center;border-top:1px solid #e0d0b5;">
      <p style="margin:0;color:#8a6a50;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;">
        Ctra. del Valle, km 4 · Salamanca, España<br>
        +34 923 000 000 · reservas@bodegasmonasterio.es
      </p>
    </div>`;
}

function confirmacionCliente(reserva) {
  const fecha = new Date(reserva.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eee;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <tr><td>${header()}</td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;color:${ACCENT_COLOR};font-size:13px;letter-spacing:0.1em;font-family:Arial,sans-serif;">CONFIRMACIÓN DE RESERVA</p>
          <h1 style="margin:0 0 24px;color:#2A1410;font-family:Georgia,serif;font-size:26px;font-weight:400;line-height:1.3;">
            Hola ${reserva.nombre}, ¡nos vemos pronto!
          </h1>
          <p style="color:#5a4030;font-size:15px;line-height:1.7;margin:0 0 32px;">
            Hemos recibido tu solicitud de reserva. Te confirmamos en breve por teléfono o email.
          </p>

          <div style="background:#F2E8D5;border-radius:6px;padding:24px;margin-bottom:32px;">
            <table width="100%" cellspacing="0">
              ${row('Experiencia', reserva.experiencia)}
              ${row('Fecha', fecha)}
              ${row('Hora', reserva.hora)}
              ${row('Personas', reserva.personas)}
              ${reserva.mensaje ? row('Notas', reserva.mensaje) : ''}
            </table>
          </div>

          <p style="color:#8a6a50;font-size:13px;line-height:1.6;margin:0;">
            ¿Necesitas cambiar o cancelar? Escríbenos a
            <a href="mailto:reservas@bodegasmonasterio.es" style="color:${BRAND_COLOR};">reservas@bodegasmonasterio.es</a>
            con al menos 48 horas de antelación.
          </p>
        </td></tr>
        <tr><td>${footer()}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function notificacionRestaurante(reserva) {
  const fecha = new Date(reserva.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eee;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <tr><td>${header()}</td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;color:${ACCENT_COLOR};font-size:13px;letter-spacing:0.1em;">NUEVA SOLICITUD DE RESERVA</p>
          <h1 style="margin:0 0 24px;color:#2A1410;font-family:Georgia,serif;font-size:22px;font-weight:400;">
            ${reserva.nombre} · ${reserva.personas} persona${reserva.personas > 1 ? 's' : ''}
          </h1>
          <div style="background:#F2E8D5;border-radius:6px;padding:24px;margin-bottom:24px;">
            <table width="100%" cellspacing="0">
              ${row('Fecha', fecha)}
              ${row('Hora', reserva.hora)}
              ${row('Experiencia', reserva.experiencia)}
              ${row('Personas', reserva.personas)}
              <tr><td colspan="2" style="padding-top:12px;border-top:1px solid #d9c9a8;"></td></tr>
              ${row('Email', `<a href="mailto:${reserva.email}" style="color:${BRAND_COLOR};">${reserva.email}</a>`)}
              ${row('Teléfono', `<a href="tel:${reserva.telefono}" style="color:${BRAND_COLOR};">${reserva.telefono}</a>`)}
              ${reserva.mensaje ? row('Mensaje', reserva.mensaje) : ''}
            </table>
          </div>
          <p style="color:#8a6a50;font-size:12px;margin:0;">
            Reserva #${reserva.id} · ${new Date().toLocaleString('es-ES')}
          </p>
        </td></tr>
        <tr><td>${footer()}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label, value) {
  return `
    <tr>
      <td style="padding:6px 0;color:#8a6a50;font-size:13px;width:120px;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;color:#2A1410;font-size:14px;font-weight:500;vertical-align:top;">${value}</td>
    </tr>`;
}

module.exports = { confirmacionCliente, notificacionRestaurante };
