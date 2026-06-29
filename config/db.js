const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB terhubung: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Gagal koneksi MongoDB: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;