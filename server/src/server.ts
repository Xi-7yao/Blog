import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import { v1 as uuidv1 } from 'uuid';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { connectDB } from './db/connect';
import articleRoutes from './routes/articleRoutes';
import userRoutes from './routes/userRoutes';
import { AppError, handleError, sendResponse } from './utils/apiUtils';
import { authMiddleware, AuthRequest } from './middleware/auth';
import { uploadRateLimiter, writeRateLimiter } from './middleware/rateLimit';
import ImageAsset from './models/ImageAsset';

dotenv.config();

const requiredEnvVars = ['HTTP_URL', 'JWT_SECRET', 'MONGO_URI', 'IMAGE_DIR'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();

const allowedOrigins = ['http://124.220.37.101', 'http://localhost:5173', 'http://127.0.0.1:5173'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new AppError('Origin is not allowed by CORS.', 403, 'CORS_NOT_ALLOWED'));
  },
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type',
  credentials: true,
};

const imageDir = process.env.IMAGE_DIR || 'article_img';
const isSafeImageFilename = (filename: string) => /^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/.test(filename);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imageDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv1()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }

    cb(new AppError('Uploaded file must be an image.', 400, 'INVALID_FILE_TYPE'));
  },
});

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/api/articles', articleRoutes);
app.use('/api/user', userRoutes);

app.post(
  '/api/img/upload',
  authMiddleware,
  uploadRateLimiter,
  upload.single('img'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        throw new AppError('Missing uploaded file. Use form field "img".', 400, 'MISSING_FILE');
      }

      const url = `${process.env.HTTP_URL}/api/img/${req.file.filename}`;
      await ImageAsset.create({
        filename: req.file.filename,
        url,
        userId: req.user!.userId,
      });

      sendResponse(res, { url });
    } catch (error) {
      handleError(res, error, req);
    }
  }
);

interface ImageRequest {
  url: string;
}

app.delete('/api/img/delete', authMiddleware, writeRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { images }: { images: ImageRequest[] } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      throw new AppError('Please provide a valid image array.', 400, 'INVALID_IMAGES');
    }

    for (const image of images) {
      if (!image.url) {
        throw new AppError('Image URL is required.', 400, 'MISSING_URL');
      }

      const filename = path.basename(image.url);

      if (!isSafeImageFilename(filename)) {
        throw new AppError('Invalid image filename.', 400, 'INVALID_IMAGE_NAME');
      }

      const filePath = path.join(imageDir, filename);
      const imageAsset = await ImageAsset.findOne({ filename }).lean();

      if (!imageAsset) {
        throw new AppError(`Image asset not found: ${filename}`, 404, 'IMAGE_ASSET_NOT_FOUND');
      }

      if (imageAsset.userId !== req.user!.userId && req.user!.role !== 'admin') {
        throw new AppError('You do not have permission to delete this image.', 403, 'FORBIDDEN');
      }

      if (!fs.existsSync(filePath)) {
        throw new AppError(`Image file not found: ${filename}`, 404, 'FILE_NOT_FOUND');
      }

      fs.unlinkSync(filePath);
      await ImageAsset.deleteOne({ filename });
    }

    sendResponse(res, { message: 'Images deleted successfully.' });
  } catch (error) {
    handleError(res, error, req);
  }
});

app.use('/api/img', express.static(imageDir, { maxAge: '1y' }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Resource not found: ${req.originalUrl}`, 404, 'NOT_FOUND'));
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  handleError(res, err, req);
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (error: unknown) {
    const unexpectedError = error instanceof Error ? error : new Error('Unknown startup error');
    console.error('Failed to start server:', {
      error: unexpectedError.message,
      stack: unexpectedError.stack,
    });
    process.exit(1);
  }
};

void start();
