import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Article from '../models/Article';
import User from '../models/User';
import { connectDB, disconnectDB } from '../db/connect';

dotenv.config();

const SALT_ROUNDS = Number.parseInt(process.env.SALT_ROUNDS || '10', 10);

type SeedUser = {
  email: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  description: string;
};

type SeedArticle = {
  articleId: string;
  authorEmail: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  published: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
};

const seedUsers: SeedUser[] = [
  {
    email: 'resume_admin@demo.local',
    username: 'demoAdmin',
    password: 'Demo123',
    role: 'admin',
    description: 'Demo admin account for local showcase data.',
  },
  {
    email: 'resume_author@demo.local',
    username: 'resumeAuthor',
    password: 'Demo123',
    role: 'user',
    description: 'Demo author account for portfolio and search showcase.',
  },
];

const seedArticles: SeedArticle[] = [
  {
    articleId: 'seed-search-react-performance',
    authorEmail: 'resume_author@demo.local',
    title: 'React 博客首页性能优化实践',
    description: '记录如何通过代码分割、路由级懒加载和构建拆包来降低博客首屏体积。',
    category: '前端',
    tags: ['React', '性能优化', '懒加载'],
    published: true,
    views: 128,
    createdAt: '2026-02-10T09:00:00.000Z',
    updatedAt: '2026-03-10T08:30:00.000Z',
    content: `# React 博客首页性能优化实践

这篇文章复盘了博客项目的首屏优化过程，目标是把首屏下载的 JavaScript 体积压到合理范围内。

## 优化策略

1. 将写作页、文章详情页、搜索页改成路由级懒加载。
2. 通过 Vite 的 \`manualChunks\` 按编辑器、UI 组件、路由、状态管理进行拆包。
3. 避免首页提前加载富文本编辑器和 Markdown 渲染链路。

## 结果

- 首屏不再一次性加载整个应用。
- 编辑器依赖只在进入写作页时才加载。
- 构建产物从单一大包改为多个按职责拆分的 chunk。

如果你在搜索里输入 React 或 xingneng，这篇文章都应该能被找到。`,
  },
  {
    articleId: 'seed-search-mongodb-troubleshooting',
    authorEmail: 'resume_author@demo.local',
    title: 'MongoDB 本地连接排查清单',
    description: '总结后端开发中最常见的 MongoDB 启动失败与连接失败场景。',
    category: '后端',
    tags: ['MongoDB', 'Node.js', '排障'],
    published: true,
    views: 96,
    createdAt: '2026-01-25T10:00:00.000Z',
    updatedAt: '2026-03-08T07:15:00.000Z',
    content: `# MongoDB 本地连接排查清单

当 Node.js 后端无法连接 MongoDB 时，我通常按下面顺序排查：

## 检查项

- 确认本机已经安装 MongoDB 服务。
- 确认 \`MONGO_URI\` 和代码中的读取变量一致。
- 确认端口 \`27017\` 处于监听状态。
- 如果使用 Atlas，确认白名单和账号密码正确。

## 排查建议

相比盲目修改代码，更高效的方式是先验证数据库实例是否真的启动，然后再检查环境变量。

这篇文章适合搜索 MongoDB、database、后端 等关键词。`,
  },
  {
    articleId: 'seed-search-fulltext-feature',
    authorEmail: 'resume_author@demo.local',
    title: '为博客实现模糊搜索与拼音检索',
    description: '介绍如何在博客系统中落地可用的搜索体验，而不是只停留在输入框。',
    category: '全栈',
    tags: ['搜索', '拼音', '博客系统'],
    published: true,
    views: 173,
    createdAt: '2026-02-18T11:30:00.000Z',
    updatedAt: '2026-03-09T12:00:00.000Z',
    content: `# 为博客实现模糊搜索与拼音检索

博客项目里常见的问题不是“没有搜索框”，而是“没有真正能用的搜索结果页”。

## 设计思路

我选择了一个对中文更友好的方案：

- 标题、摘要、分类、标签都参与搜索。
- 支持模糊匹配，避免只接受完全相同的关键词。
- 支持拼音检索，例如搜索 qianduan 也能命中前端相关内容。

## 为什么这样做

MongoDB 的全文索引对中文场景并不总是理想，所以先把稳定、可解释、易维护的实现做好，再考虑进一步升级。

你可以在搜索页试试 搜索、前端、qianduan 这些关键词。`,
  },
  {
    articleId: 'seed-search-reading-stats',
    authorEmail: 'resume_author@demo.local',
    title: '阅读统计应该如何接入博客系统',
    description: '从数据模型、接口设计和前端展示三个角度梳理阅读量功能。',
    category: '产品',
    tags: ['阅读统计', '埋点', '数据设计'],
    published: true,
    views: 64,
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-07T09:45:00.000Z',
    content: `# 阅读统计应该如何接入博客系统

阅读统计是博客里非常适合做的基础数据功能，因为实现成本不高，但能明显提升产品完成度。

## 实现要点

- 在文章模型中增加 \`stats.views\` 字段。
- 仅对公开文章的详情访问进行计数。
- 在文章卡片与详情页里同步展示阅读量。

## 这样设计的好处

一方面接口简单，另一方面不会把前端埋点逻辑写得太重。

搜索 阅读统计、views、stats 都可以命中这篇内容。`,
  },
  {
    articleId: 'seed-search-draft-boundary',
    authorEmail: 'resume_author@demo.local',
    title: '博客草稿权限边界改造复盘',
    description: '复盘如何收紧公开文章与草稿内容的访问边界，避免未发布内容泄露。',
    category: '后端',
    tags: ['权限控制', '安全', '草稿'],
    published: true,
    views: 88,
    createdAt: '2026-02-28T14:20:00.000Z',
    updatedAt: '2026-03-06T06:20:00.000Z',
    content: `# 博客草稿权限边界改造复盘

早期版本中，公开列表接口和文章详情接口没有明确限制草稿的读取边界。

## 改造内容

- 公开列表默认只返回已发布文章。
- 草稿详情只允许作者本人或管理员访问。
- 对未授权访问草稿的请求返回 404，而不是直接暴露资源存在性。

## 收获

这类改动很适合写进简历，因为它体现的是接口设计和安全意识，而不只是功能堆砌。`,
  },
  {
    articleId: 'seed-draft-editor-refactor',
    authorEmail: 'resume_author@demo.local',
    title: '编辑器页重构待办清单',
    description: '这是一篇草稿，用来演示未发布内容不会出现在公开列表和搜索结果中。',
    category: '前端',
    tags: ['草稿', '编辑器', '重构'],
    published: false,
    views: 0,
    createdAt: '2026-03-09T14:00:00.000Z',
    updatedAt: '2026-03-10T05:00:00.000Z',
    content: `# 编辑器页重构待办清单

这是未发布草稿，只应该被作者在草稿箱里看到。

- 拆分自动保存逻辑
- 拆分图片管理逻辑
- 提炼发布表单与错误处理`,
  },
];

const seed = async () => {
  await connectDB();

  const usersByEmail = new Map<string, { userId: string; username: string }>();

  for (const user of seedUsers) {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
    const savedUser = await User.findOneAndUpdate(
      { email: user.email },
      {
        $set: {
          username: user.username,
          password: hashedPassword,
          description: user.description,
          role: user.role,
          refreshTokens: [],
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!savedUser) {
      throw new Error(`Failed to seed user ${user.email}`);
    }

    usersByEmail.set(user.email, {
      userId: savedUser._id.toString(),
      username: savedUser.username,
    });
  }

  for (const article of seedArticles) {
    const author = usersByEmail.get(article.authorEmail);

    if (!author) {
      throw new Error(`Missing seed user for ${article.authorEmail}`);
    }

    await Article.findOneAndUpdate(
      { articleId: article.articleId },
      {
        $set: {
          articleId: article.articleId,
          meta: {
            title: article.title,
            username: author.username,
            userId: author.userId,
            tags: article.tags,
            category: article.category,
            createdAt: new Date(article.createdAt),
            updatedAt: new Date(article.updatedAt),
          },
          description: article.description,
          content: article.content,
          published: article.published,
          stats: {
            views: article.views,
          },
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );
  }

  console.log(`Seeded ${seedUsers.length} users and ${seedArticles.length} articles.`);
  console.log('Demo author login: resume_author@demo.local / Demo123');
  console.log('Demo admin login: resume_admin@demo.local / Demo123');
};

seed()
  .catch((error) => {
    console.error('Failed to seed demo data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
