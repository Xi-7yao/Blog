import { Schema, model } from 'mongoose';

interface User {
  username: string;
  password: string;
  email: string;
  description: string;
  refreshTokens: string[];
  role: 'user' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<User>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9\u4e00-\u9fa5]+$/,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 100,
      default: '暂未提供修改功能',
    },
    refreshTokens: {
      type: [String],
      default: [],
      validate: {
        validator: (tokens: string[]) => tokens.every((token) => token.length <= 500),
        message: '刷新令牌长度不能超过 500 字符',
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true,
    },
  },
  { timestamps: true }
);

// 验证明文密码（未加密）
UserSchema.pre('save', async function (next) {
  if (this.isModified('password') && !this.password.startsWith('$2b$')) {
    const password = this.password;
    if (password.length < 6 || password.length > 20) {
      return next(new Error('密码长度必须在 6 到 20 字符之间'));
    }
    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      return next(new Error('密码只能包含字母和数字'));
    }
  }
  next();
});

const User = model<User>('User', UserSchema, 'users');
export default User;