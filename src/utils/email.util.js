/**
 * Email Utility
 * Utilidad para enviar correos electrónicos
 */

const { transporter, emailFrom } = require('../config/email.config');

/**
 * Enviar correo electrónico
 * @param {Object} options - Opciones del correo
 * @param {string} options.to - Email del destinatario
 * @param {string} options.subject - Asunto del correo
 * @param {string} options.html - Contenido HTML del correo
 * @param {string} options.text - Contenido en texto plano (opcional)
 * @returns {Promise<Object>} Resultado del envío
 */
const sendEmail = async ({ to, subject, html, text = '' }) => {
  try {
    // Si el email no está configurado, simular el envío
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'tu-email@gmail.com') {
      console.log('📧 [SIMULADO] Email que se enviaría:', {
        to,
        subject,
        from: emailFrom,
      });
      console.log('   💡 Configura EMAIL_USER y EMAIL_PASSWORD en .env para envío real');
      
      return {
        success: true,
        messageId: 'simulated-' + Date.now(),
        response: 'Email simulado (no enviado)',
        simulated: true,
      };
    }

    const mailOptions = {
      from: emailFrom,
      to,
      subject,
      html,
      text: text || stripHtml(html), // Si no hay texto plano, extrae del HTML
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email enviado:', {
      to,
      subject,
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    throw new Error(`Error al enviar correo: ${error.message}`);
  }
};

/**
 * Remover etiquetas HTML básicas (función auxiliar)
 * @param {string} html - Contenido HTML
 * @returns {string} Texto sin etiquetas
 */
const stripHtml = (html) => {
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Enviar email de recuperación de contraseña
 * @param {string} to - Email del destinatario
 * @param {string} resetToken - Token de recuperación
 * @param {string} userName - Nombre del usuario
 * @returns {Promise<Object>} Resultado del envío
 */
const sendPasswordResetEmail = async (to, resetToken, userName = 'Usuario') => {
  // Construir URL completa para reset de contraseña
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5504';
  // Asegurar que la URL no termine con '/' para evitar '//' en la ruta
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // ⚠️ CORRECCIÓN: Usar la ruta /reset-password que redirige correctamente
  const resetUrl = `${cleanBaseUrl}/view/password/reset-password.html?token=${resetToken}`;
  const subject = 'Recuperación de contraseña - Funcavida';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 40px 20px; background-color: #F4F2EF; font-family: Arial, sans-serif;">
      
      <!-- Contenedor principal -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);">
        
        <!-- Nombre de marca -->
        <tr>
          <td style="text-align: center; padding: 40px 20px 20px;">
            <h2 style="font-size: 28px; font-weight: 700; color: #ff9f2a; margin: 0; letter-spacing: 1px;">FUNCAVIDA</h2>
          </td>
        </tr>
        
        <!-- Título -->
        <tr>
          <td style="padding: 20px 40px;">
            <h1 style="font-size: 26px; font-weight: 700; color: #222; margin: 0 0 14px; text-align: center;">
              Recuperación de Contraseña
            </h1>
          </td>
        </tr>
        
        <!-- Contenido -->
        <tr>
          <td style="padding: 0 40px 30px; color: #222; font-size: 14px; line-height: 1.6;">
            <p style="margin: 0 0 15px;">Hola <strong>${userName}</strong>,</p>
            <p style="margin: 0 0 15px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p style="margin: 0 0 15px;">Haz clic en el botón de abajo para crear una nueva contraseña:</p>
          </td>
        </tr>
        
        <!-- Botón -->
        <tr>
          <td style="text-align: center; padding: 0 40px 30px;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background-color: #ff9f2a; color: #ffffff; text-decoration: none; border-radius: 22px; font-weight: 600; box-shadow: 0 4px 10px rgba(255,159,42,.35);">
              Restablecer Contraseña
            </a>
          </td>
        </tr>
        
        <!-- Enlace alternativo -->
        <tr>
          <td style="padding: 0 40px 20px; color: #555; font-size: 13px; text-align: center;">
            <p style="margin: 0 0 10px;">O copia y pega este enlace en tu navegador:</p>
            <p style="margin: 0; word-break: break-all; color: #ff9f2a; background-color: #fff8f0; padding: 12px; border-radius: 6px; border: 1px solid #ffe4cc;">
              ${resetUrl}
            </p>
          </td>
        </tr>
        
        <!-- Nota de expiración -->
        <tr>
          <td style="padding: 20px 40px 30px; color: #7a7a7a; font-size: 13px; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: 600;">⏱️ Este enlace expirará en 30 minutos.</p>
            <p style="margin: 0; color: #999;">Solo puede ser usado una vez.</p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #262525; color: #ffffff; padding: 25px 40px; border-radius: 0 0 14px 14px; font-size: 13px; text-align: center;">
            <p style="margin: 0 0 12px; font-weight: 600;">© ${new Date().getFullYear()} Funcavida. Todos los derechos reservados.</p>
            <p style="margin: 0; color: #cfe2ff; line-height: 1.5;">
              Si no solicitaste este cambio, ignora este correo y tu contraseña permanecerá sin cambios.
            </p>
          </td>
        </tr>
        
      </table>
      
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
};
