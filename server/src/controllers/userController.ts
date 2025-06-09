import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AppError, handleError, sendResponse } from '../utils/apiUtils';
import { StringValue } from 'ms'

// 环境变量
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10');
const ACCESS_TOKEN_EXPIRY: StringValue = (process.env.ACCESS_TOKEN_EXPIRY || '15m') as StringValue;
const REFRESH_TOKEN_EXPIRY: StringValue = (process.env.REFRESH_TOKEN_EXPIRY || '7d') as StringValue;

if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new AppError('JWT_SECRET 或 REFRESH_SECRET 未定义', 500, 'CONFIG_ERROR');
}

// 验证明文密码
const validatePassword = (password: string): void => {
  if (password.length < 6 || password.length > 20) {
    throw new AppError('密码长度必须在 6 到 20 字符之间', 400, 'INVALID_PASSWORD_LENGTH');
  }
  if (!/^[a-zA-Z0-9]+$/.test(password)) {
    throw new AppError('密码只能包含字母和数字', 400, 'INVALID_PASSWORD_FORMAT');
  }
};

// 生成随机用户名
const generateUsername = () => {
  const randomNum = Math.floor(100000 + Math.random() * 9000000);
  return `用户${randomNum}`;
};

// 生成令牌
const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign({ userId, email, role }, JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
  return { accessToken, refreshToken };
};

// 设置 Cookie
const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 60 * 60 * 24 * 1000,
  });
};

interface RegisterRequest {
  email: string;
  password: string;
  inviteCode: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface UpdateUsernameRequest {
  username: string;
}

// 注册
export const register = async (req: Request<{}, {}, RegisterRequest>, res: Response): Promise<void> => {
  try {
    const { password, email, inviteCode } = req.body;
    if (!password || !email) {
      throw new AppError('密码和邮箱为必填项', 400, 'MISSING_FIELDS');
    }
    validatePassword(password);
    const existEmail = await User.findOne({ email }).lean();
    if (existEmail) {
      throw new AppError('邮箱已存在', 409, 'EMAIL_EXISTS');
    }
    let username = generateUsername();
    const maxAttempts = 10;
    let attempts = 0;
    while (attempts < maxAttempts) {
      const existingUser = await User.findOne({ username }).lean();
      if (!existingUser) break;
      username = generateUsername();
      attempts++;
    }
    if (attempts >= maxAttempts) {
      throw new AppError('无法生成唯一用户名', 500, 'USERNAME_GENERATION_FAILED');
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const role = inviteCode === process.env.INVITECODE? 'admin' : 'user';
    const user = await User.create({
      username,
      password: hashedPassword,
      email, 
      description: "暂无支持修改",
      refreshTokens: [],
      role: role
    });
    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.email, user.role);
    user.refreshTokens = [refreshToken];
    await user.save();
    setTokenCookies(res, accessToken, refreshToken);
    sendResponse(res, {
      user: { userId: user._id, username: user.username, email: user.email, description: user.description, role: user.role },
    }, 201);
  } catch (error) {
    handleError(res, error);
  }
};

// 登录
export const login = async (req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('邮箱和密码为必填项', 400, 'MISSING_FIELDS');
    }

    // 验证明文密码
    validatePassword(password);
    // console.log('Login request:', { email, passwordLength: password.length });

    const user = await User.findOne({ email }).select('username email password refreshTokens description role');
    if (!user) {
      throw new AppError('邮箱不存在', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('密码错误', 401, 'INVALID_PASSWORD');
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.email, user.role);
    user.refreshTokens = [refreshToken];
    await user.save();

    setTokenCookies(res, accessToken, refreshToken); 
    console.log(user);
    sendResponse(res, {
      user: { userId: user._id, username: user.username, email: user.email, description: user.description, role: user.role },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// 刷新 token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new AppError('未提供刷新令牌', 401, 'MISSING_REFRESH_TOKEN');
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      throw new AppError('无效刷新令牌', 403, 'INVALID_REFRESH_TOKEN');
    }

    const { accessToken } = generateTokens(user._id.toString(), user.email, user.role);
    setTokenCookies(res, accessToken, refreshToken);
    sendResponse(res, {
      user: { userId: user._id, username: user.username, email: user.email, description: user.description },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// 获取用户信息
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      throw new AppError('未提供令牌', 401, 'MISSING_TOKEN');
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; email: string };
    const user = await User.findById(decoded.userId).select('username email description role').lean();
    if (!user) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }
    sendResponse(res, {
      user: { userId: user._id, username: user.username, email: user.email, description: user.description, role: user.role },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// 登出
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET!) as { userId: string };
      await User.updateOne({ _id: decoded.userId }, { $pull: { refreshTokens: refreshToken } });
    }

    res.clearCookie('accessToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    sendResponse(res, { message: '登出成功' });
  } catch (error) {
    handleError(res, error);
  }
};

// 修改用户名
export const updateUsername = async (req: Request<{}, {}, UpdateUsernameRequest>, res: Response): Promise<void> => {
  try {
    const { username } = req.body;
    const token = req.cookies.accessToken;
    if (!token) {
      throw new AppError('未提供令牌', 401, 'MISSING_TOKEN');
    }
    if (!username) {
      throw new AppError('用户名不能为空', 400, 'MISSING_USERNAME');
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; email: string };
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    const existingUser = await User.findOne({ username }).lean();
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      throw new AppError('用户名已存在', 409, 'USERNAME_EXISTS');
    }

    user.username = username;
    await user.save();
    sendResponse(res, {
      user: { userId: user._id, username: user.username, email: user.email, description: user.description },
    });
  } catch (error) {
    handleError(res, error);
  }
};