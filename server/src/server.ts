import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './db/connect';
import articleRoutes from './routes/articleRoutes';
import userRoutes from './routes/userRoutes';
import multer from 'multer';
import { v1 as uuidv1 } from 'uuid';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { AppError, handleError, sendResponse } from './utils/apiUtils';
import { authMiddleware, AuthRequest } from './middleware/auth';

dotenv.config();

// 验证环境变量
const requiredEnvVars = ['HTTP_URL', 'JWT_SECRET', 'MONGO_URI', 'IMAGE_DIR'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`缺少环境变量: ${envVar}`);
    process.exit(1);
  }
}

const app = express();

// CORS 配置
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://124.220.37.101',
      'http://localhost:5173'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new AppError('CORS 不允许的来源', 403, 'CORS_NOT_ALLOWED'));
    }
  },
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type',
  credentials: true,
};

const imageDir = process.env.IMAGE_DIR || 'article_img';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv1() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('上传的文件必须是图片', 400, 'INVALID_FILE_TYPE'));
    }
  },
});

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/api/articles', articleRoutes);
app.use('/api/user', userRoutes);

app.post('/api/img/upload', authMiddleware, upload.single('img'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      throw new AppError('未找到上传的文件，请使用字段名 "img"', 400, 'MISSING_FILE');
    }
    const url = `${process.env.HTTP_URL}/api/img/${req.file.filename}`;
    sendResponse(res, { url }, 200);
  } catch (error) {
    handleError(res, error);
  }
});

interface ImageRequest {
  url: string;
}

app.delete('/api/img/delete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { images }: { images: ImageRequest[] } = req.body;
    if (!Array.isArray(images) || images.length === 0) {
      throw new AppError('请提供有效的图片数组', 400, 'INVALID_IMAGES');
    }
    for (const img of images) {
      if (!img.url) {
        throw new AppError('图片 URL 缺失', 400, 'MISSING_URL');
      }
      const filename = path.basename(img.url);
      const filePath = path.join(imageDir, filename);
      if (!fs.existsSync(filePath)) {
        throw new AppError(`文件不存在: ${filename}`, 404, 'FILE_NOT_FOUND');
      }
      fs.unlinkSync(filePath);
    }
    sendResponse(res, { message: '删除成功' }, 200);
  } catch (error) {
    handleError(res, error);
  }
});

app.use('/api/img', express.static(imageDir, { maxAge: '1y' }));

app.use((req: Request, res: Response) => {
  throw new AppError('找不到请求的资源', 404, 'NOT_FOUND');
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  handleError(res, err, req);
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`服务器运行在端口: ${PORT}`));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('未知错误');
    console.error('无法启动服务器:', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

start();