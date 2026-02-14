const cron = require('node-cron');
const nodemailer = require('nodemailer');
const License = require('../models/License');

// Configuración del Transporter
// TODO: Reemplazar con credenciales reales en variables de entorno (.env)
// Ejemplo para Gmail:
/*
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Tu correo
    pass: process.env.EMAIL_PASS  // Tu contraseña de aplicación
  }
});
*/

// Configuración temporal (simulada) para desarrollo
// En producción, configurar SMTP real
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal_pass'
    }
});

/**
 * Busca licencias que expiran exactamente en N días (parametrizable)
 */
const checkExpiringLicenses = async () => {
  console.log('Ejecutando chequeo de expiración de licencias...');
  
  const today = new Date();
  const targetDate = new Date();
  const warningDays = parseInt(process.env.LICENSE_EXPIRY_WARNING_DAYS || '15', 10);
  targetDate.setDate(today.getDate() + warningDays);
  
  // Definir rango para ese día (00:00 a 23:59)
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const licenses = await License.find({
      expirationDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'active'
    });

    console.log(`Encontradas ${licenses.length} licencias que expiran el ${startOfDay.toLocaleDateString()}`);

    for (const license of licenses) {
      if (license.email) {
        await sendExpirationEmail(license);
      }
    }
  } catch (error) {
    console.error('Error al chequear licencias:', error);
  }
};

/**
 * Envía el correo de notificación
 */
const sendExpirationEmail = async (license) => {
  try {
    const warningDays = parseInt(process.env.LICENSE_EXPIRY_WARNING_DAYS || '15', 10);
    // Si no hay configuración real, solo logueamos
    if (!process.env.EMAIL_USER && !process.env.SMTP_HOST) {
        console.log(`[SIMULACIÓN] Enviando correo a ${license.email} sobre expiración el ${license.expirationDate}`);
        return;
    }

    const info = await transporter.sendMail({
      from: '"SaaS License Manager" <no-reply@saas.com>',
      to: license.email,
      subject: `⚠️ Aviso Importante: Su licencia expira en ${warningDays} días`,
      text: `Hola ${license.clientId || 'Cliente'},\n\nSu licencia para el restaurante "${license.restaurantName}" expirará el ${new Date(license.expirationDate).toLocaleDateString()}.\n\nPor favor contacte a soporte para renovar y evitar interrupciones.\n\nSaludos,\nEquipo de Soporte`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #d97706;">Aviso de Expiración Próxima</h2>
            <p>Hola <strong>${license.clientId || 'Cliente'}</strong>,</p>
            <p>Le informamos que su licencia para el restaurante <strong>${license.restaurantName}</strong> está próxima a vencer.</p>
            
            <div style="background-color: #fffbeb; padding: 15px; border-radius: 5px; border: 1px solid #fcd34d; margin: 20px 0;">
                <p style="margin: 0;"><strong>Fecha de Expiración:</strong> ${new Date(license.expirationDate).toLocaleDateString()}</p>
                <p style="margin: 10px 0 0 0; color: #b45309;">Quedan ${warningDays} días de servicio.</p>
            </div>

            <p>Por favor, póngase en contacto con nuestro equipo de soporte para gestionar su renovación y evitar cualquier interrupción en su servicio de punto de venta.</p>
            
            <br>
            <hr style="border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #888;">Este es un mensaje automático, por favor no responda a este correo.</p>
        </div>
      `
    });
    console.log(`Correo enviado a ${license.email}: ${info.messageId}`);
  } catch (error) {
    console.error(`Error enviando correo a ${license.email}:`, error);
  }
};

/**
 * Inicializa el Cron Job
 */
const initScheduledJobs = () => {
  // Ejecutar todos los días a las 9:00 AM
  cron.schedule('0 9 * * *', () => {
    checkExpiringLicenses();
  });
  console.log('✅ Tarea programada iniciada: Verificación diaria de licencias (09:00 AM)');
  
  // Ejecutar una vez al inicio para pruebas (opcional, comenta si no deseas esto)
  // setTimeout(checkExpiringLicenses, 5000); 
};

module.exports = { initScheduledJobs, checkExpiringLicenses };
