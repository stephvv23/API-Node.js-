/**
 * Email Configuration
 * Configuración de Nodemailer para envío de correos
 * 
 * Variables de entorno necesarias:
 * - EMAIL_HOST: Servidor SMTP (ej: smtp.gmail.com)
 * - EMAIL_PORT: Puerto SMTP (ej: 587 para TLS, 465 para SSL)
 * - EMAIL_USER: Usuario/email del remitente
 * - EMAIL_PASSWORD: Contraseña o app password
 * - EMAIL_FROM: Email que aparecerá como remitente
 */

const nodemailer = require('nodemailer');

// Configuración del transporter de Nodemailer
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false, // true para SSL (puerto 465)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

// Crear transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verificar conexión solo si las credenciales están configuradas
if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'tu-email@gmail.com') {
  transporter.verify((error, success) => {
    if (error) {
      console.warn('⚠️  Advertencia: Email no configurado correctamente.');
      console.warn('   Configura EMAIL_USER y EMAIL_PASSWORD en .env para enviar correos.');
    } else {
      console.log('✅ Servidor de email listo para enviar mensajes');
    }
  });
} else {
  console.warn('⚠️  Email no configurado. Los correos se simularán en consola.');
}

module.exports = {
  transporter,
  emailFrom: process.env.EMAIL_FROM || process.env.EMAIL_USER,
};
