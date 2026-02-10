require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const connectDB = require('./src/config/db');

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = 'walter81w@hotmail.es'; // Corregido el doble @
    const adminPassword = 'Qwerty';
    const adminName = 'Admin Walter';

    // Verificar si ya existe
    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      console.log('El usuario administrador ya existe.');
      // Opcional: Actualizar contraseña si se desea forzar
      // existingUser.password = adminPassword;
      // await existingUser.save();
      process.exit(0);
    }

    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });

    console.log('Usuario administrador creado exitosamente:');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${adminPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creando usuario:', error);
    process.exit(1);
  }
};

seedAdmin();