import { Request, Response } from 'express';
import Article, { IArticle } from '../models/Article';
import { v4 as uuidv4 } from 'uuid';
import { handleError, sendResponse, paginateQuery, AppError } from '../utils/apiUtils';
import { AuthRequest } from '../middleware/auth';

interface ArticleResponse {
  articleId: string;
  meta: {
    title: string;
    username: string;
    userId: string;
    tags: string[];
    category: string;
    createdAt: Date;
    updatedAt: Date;
  };
  description: string;
  content?: string;
}

interface PaginatedResponse<T> {
  articles: T[];
  total: number;
}

const validateQueryParams = (page: string, limit: string) => {
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  if (isNaN(parsedPage) || parsedPage < 1) {
    throw new AppError('页码必须是正整数', 400, 'INVALID_PAGE');
  }
  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new AppError('每页限制必须在 1 到 100 之间', 400, 'INVALID_LIMIT');
  }
  return { page: parsedPage, limit: parsedLimit };
};

// 获取所有文章
export const getAllArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', published = 'all' } = req.query;
    const { page: parsedPage, limit: parsedLimit } = validateQueryParams(page as string, limit as string);
    // const query = { published: true };
    const query: any = {};
    if (published !== 'all') {
      query.published = published === 'true';
    }
    const options = {
      page: parsedPage,
      limit: parsedLimit,
      select: 'articleId meta description published',
    };
    const { items: articles, total } = await paginateQuery<ArticleResponse>(Article, query, options);
    sendResponse(res, { articles, total });
  } catch (error) {
    handleError(res, error);
  }
};

// 根据 ID 获取文章
export const getArticleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleId } = req.params;
    // console.log(articleId)
    if (!articleId) {
      throw new AppError('文章 ID 缺失', 400, 'MISSING_ID');
    }
    const article = await Article.findOne({ articleId }).select('articleId meta description content published').lean();
    if (!article) {
      throw new AppError('文章不存在', 404, 'ARTICLE_NOT_FOUND');
    }
    // console.log(article)
    sendResponse(res, { article });
  } catch (error) {
    handleError(res, error);
  }
};

// 创建文章
export const createArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // console.log(req);
    const { meta, content, description, published } = req.body;
    if (!meta?.userId) {
      throw new AppError('用户 ID 缺失', 400, 'MISSING_AUTHOR_ID');
    }
    if (req.user && meta.userId !== req.user.userId) {
      throw new AppError('无权创建文章', 403, 'FORBIDDEN');
    }
    const newArticle = new Article({
      articleId: uuidv4(),
      meta: {
        ...meta,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      content,
      description: description || '未填写描述',
      published: published || false,
    });
    const article = await newArticle.save();
    sendResponse(res, { article: article.toObject() }, 201);
  } catch (error) {
    handleError(res, error);
  }
};

// 更新文章
export const updateArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { articleId } = req.params;
    const { meta, content, description, published } = req.body;
    if (!articleId) {
      throw new AppError('文章 ID 缺失', 400, 'MISSING_ID');
    }
    if (!req.user) {
      throw new AppError('未登录', 401, 'UNAUTHORIZED');
    }
    console.log(`Updating article ${articleId} by user ${req.user.userId}`);
    const article = await Article.findOne({ articleId }).lean().exec();
    if (!article) {
      throw new AppError('文章不存在', 404, 'ARTICLE_NOT_FOUND');
    }

    if (req.user && article.meta.userId !== req.user.userId && req.user.role === 'user') {
      throw new AppError('无权更新文章', 403, 'FORBIDDEN');
    }
    const sanitizedData: Partial<IArticle> = {};
    if (meta) {
      sanitizedData.meta = {
        ...article.meta,
        ...meta,
        updatedAt: new Date(),
        createdAt: article.meta.createdAt,
        userId: article.meta.userId,
      };
    }
    if (content) {
      sanitizedData.content = content;
    }
    if (description) {
      sanitizedData.description = description;
    }
    if (typeof published === 'boolean') {
      sanitizedData.published = published;
    }
    const updatedArticle = await Article.findOneAndUpdate(
      { articleId },
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedArticle) {
      throw new AppError('更新失败', 500, 'UPDATE_FAILED');
    }

    // 返回响应
    sendResponse(res, { article: updatedArticle });
  } catch (error) {
    handleError(res, error);
  }
};

// 删除文章
export const deleteArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { articleId } = req.params;
    if (!articleId) {
      throw new AppError('文章 ID 缺失', 400, 'MISSING_ID');
    }
    const article = await Article.findOneAndDelete({ articleId }).lean();
    if (!article) {
      throw new AppError('文章不存在', 404, 'ARTICLE_NOT_FOUND');
    }
    if (req.user && article.meta.userId !== req.user.userId && req.user.role === 'user') {
      throw new AppError('无权删除文章', 403, 'FORBIDDEN');
    }
    sendResponse(res, {articleId});
  } catch (error) {
    handleError(res, error);
  }
};

// 按标签和类别过滤文章
export const getArticlesByTagsAndCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tags, category, page = '1', limit = '10' } = req.query;
    const { page: parsedPage, limit: parsedLimit } = validateQueryParams(page as string, limit as string);
    const tagsArray = Array.isArray(tags) ? tags : tags ? (tags as string).split(',') : [];
    const query: any = { published: true };
    if (tagsArray.length > 0) {
      query['meta.tags'] = { $all: tagsArray };
    }
    if (category) {
      query['meta.category'] = category;
    }
    const options = {
      page: parsedPage,
      limit: parsedLimit,
      select: 'articleId meta description published',
    };
    const { items: articles, total } = await paginateQuery<ArticleResponse>(Article, query, options);
    sendResponse(res, { articles, total });
  } catch (error) {
    handleError(res, error);
  }
};

// 按作者 ID 获取文章
export const getArticleByUserId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, page = '1', limit = '10', published = 'all' } = req.query;
    if (!userId) {
      throw new AppError('用户 ID 缺失', 400, 'MISSING_AUTHOR_ID');
    }
    if (req.user && req.user.userId !== userId) {
      throw new AppError('无权访问', 403, 'FORBIDDEN');
    }
    const query: any = { 'meta.userId': userId };
    if (published !== 'all') {
      query.published = published === 'true';
    }
    const { page: parsedPage, limit: parsedLimit } = validateQueryParams(page as string, limit as string);
    const options = {
      page: parsedPage,
      limit: parsedLimit,
      select: 'articleId meta description published',
    };
    const { items: articles, total } = await paginateQuery<ArticleResponse>(Article, query, options);
    sendResponse(res, { articles, total });
  } catch (error) {
    handleError(res, error);
  }
};

// 获取所有类别
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Article.distinct('meta.category').lean();
    sendResponse(res, { categories });
  } catch (error) {
    handleError(res, error);
  }
};