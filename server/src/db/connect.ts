import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (): Promise<void> => {
  const url = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!url) {
    throw new Error('缺少 MongoDB 连接字符串，请配置 MONGO_URI');
  }
  try {
    await mongoose.connect(url);
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    throw error;
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

