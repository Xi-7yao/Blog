import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (): Promise<void> => {
  const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/articles_db';
  try {
    await mongoose.connect(url);
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB连接已关闭');
  } catch (error) {
    console.error('MongoDB关闭连接失败:', error);
  }
}; 

