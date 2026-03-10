# Blog

一个前后端分离的博客系统，适合作为个人作品集与全栈项目展示。

## Tech Stack

- Frontend: React, TypeScript, Vite, Redux Toolkit, Ant Design, ByteMD
- Backend: Node.js, Express, TypeScript, JWT, Multer
- Database: MongoDB, Mongoose

## Core Features

- 用户注册、登录、刷新登录态
- 文章创建、编辑、删除、发布
- 草稿保存与草稿箱管理
- 图片上传与删除
- 文章搜索
- 阅读统计
- 文章权限边界控制

## Project Structure

- `client/`: 前端应用
- `server/`: 后端接口与数据库逻辑
- `docs/`: 项目说明与简历材料

## Local Setup

### 1. Prepare MongoDB

你可以使用本地 MongoDB，或者使用 MongoDB Atlas。

如果使用本地 MongoDB，请确认它监听的是：

```env
mongodb://localhost:27017
```

### 2. Configure Backend Env

在 `server/` 下复制环境变量模板：

```bash
cp .env.example .env
```

Windows PowerShell 可以手动复制或新建 `server/.env`。

最关键的变量是：

```env
MONGO_URI=mongodb://localhost:27017/articles_db
JWT_SECRET=your-secret
REFRESH_SECRET=your-refresh-secret
INVITECODE=your-admin-invite-code
HTTP_URL=http://localhost:5000
IMAGE_DIR=article_img
```

### 3. Start Backend

```bash
cd server
npm install
npm run dev
```

### 4. Start Frontend

```bash
cd client
npm install
npm run dev
```

默认地址：

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Demo Data

为了快速演示搜索、阅读统计、草稿权限边界等功能，可以在 `server/` 目录执行：

```bash
npm run seed:demo
```

这个脚本是可重复运行的，会以 upsert 的方式写入演示账号和文章，不会重复创建相同 demo 数据。

演示账号：

- 作者账号：`resume_author@demo.local / Demo123`
- 管理员账号：`resume_admin@demo.local / Demo123`

## MongoDB Troubleshooting

如果后端提示 MongoDB 连接失败，建议按这个顺序排查：

1. `server/.env` 是否配置了 `MONGO_URI`
2. `MONGO_URI` 是否写对
3. 本机 MongoDB 是否真的安装并运行
4. 如果使用 Atlas，当前 IP 是否已加入白名单
5. 用户名、密码、数据库名是否正确

## Resume Notes

如果你打算把这个项目写进简历，可以先看：

- [resume-project-highlights.md](/D:/github_blog/Blog/docs/resume-project-highlights.md)
