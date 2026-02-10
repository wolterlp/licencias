const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/licencias', {
        dbName: 'licencias',
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('⚠️ MongoDB no está disponible. Reintentando conexión en 5 segundos...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
