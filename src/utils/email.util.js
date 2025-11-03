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
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5504/view';
  // Asegurar que la URL no termine con '/' para evitar '//' en la ruta
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const resetUrl = `${cleanBaseUrl}/reset-password.html?token=${resetToken}`;
  
  const subject = 'Recuperación de contraseña - FUNCA';
  
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          text-align: center;
        }
        .content {
          padding: 30px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          margin: 20px 0;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        }
        .button:hover {
          background-color: #45a049;
        }
        .footer {
          background-color: #f4f4f4;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 10px;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Recuperación de Contraseña</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${userName}</strong>,</p>
          
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
          
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
          </div>
          
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #4CAF50; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li>Este enlace expirará en <strong>30 minutos</strong></li>
              <li>Solo puede ser usado <strong>una vez</strong></li>
              <li>Si no solicitaste este cambio, ignora este correo y tu contraseña permanecerá sin cambios</li>
            </ul>
          </div>
          
          <p>Si tienes problemas o no solicitaste este cambio, contacta con el equipo de soporte.</p>
          
          <p>Saludos cordiales,<br>
          <strong>Equipo de FUNCA</strong></p>
        </div>
        <div class="footer">
          <p>Este es un correo automático, por favor no responder.</p>
          <p><strong>FUNCA</strong> - Fundación Nacional del Cáncer</p>
          <p>&copy; ${new Date().getFullYear()} Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
};
