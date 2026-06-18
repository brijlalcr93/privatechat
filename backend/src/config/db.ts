import dns from 'dns';
import mongoose from 'mongoose';

// Force Node.js to use Google DNS when running locally to resolve MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  // Ignore/warn in case of error in environments that block setting DNS servers
}

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/privatechat';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};
