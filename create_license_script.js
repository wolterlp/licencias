require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const licenseService = require('./src/services/licenseService');

const createTestLicense = async () => {
  try {
    await connectDB();

    console.log('Generando licencia de prueba...');

    const licenseData = {
      productId: 'LunIA_POS',
      clientId: 'CLIENTE_PRUEBA_001',
      restaurantName: 'Restaurante Demo',
      email: 'demo@lunia.com',
      phone: '555-123-4567', // Teléfono de prueba
      authorizedDomainOrIP: '*', // Allow all for test
      licenseType: 'annual',     // 1 year valid
      maxDevices: 5
    };

    const newLicense = await licenseService.createLicense(licenseData);

    console.log('\n=============================================');
    console.log('✅ LICENCIA GENERADA CON ÉXITO');
    console.log('=============================================');
    console.log(`🔑 Clave:      ${newLicense.licenseKey}`);
    console.log(`📅 Expira:     ${newLicense.expirationDate.toISOString().split('T')[0]}`);
    console.log(`🏢 Cliente:    ${newLicense.restaurantName}`);
    console.log(`💻 Dispositivos: ${newLicense.maxDevices}`);
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generando licencia:', error.message);
    process.exit(1);
  }
};

createTestLicense();
