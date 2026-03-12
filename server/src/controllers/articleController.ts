import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Article, { IArticle } from '../models/Article';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError, handleError, paginateQuery, sendResponse } from '../utils/apiUtils';
import { fuzzySearch } from '../utils/fuzzySearch';
import {
  sanitizeArticleContent,
  sanitizeArticleTags,
  sanitizeArticleText,
} from '../utils/contentSanitizer';

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
  published: boolean;
  stats?: {
    views: number;
  };
}

interface SearchArticleResponse {
  article: ArticleResponse;
  snippet: string;
  score: number;
}

interface ArticleMetaInput {
  title: string;
  tags: string[];
  category: string;
}

interface ArticleRequestBody {
  meta?: Partial<ArticleMetaInput>;
  description?: string;
  content?: string;
  published?: boolean;
}

const ARTICLE_LIST_FIELDS = 'articleId meta description published stats';
const ARTICLE_DETAILS_FIELDS = 'articleId meta description content published stats';

const validateQueryParams = (page: string, limit: string) => {
  const parsedPage = Number.parseInt(page, 10);
  const parsedLimit = Number.parseInt(limit, 10);

  if (Number.isNaN(parsedPage) || parsedPage < 1) {
    throw new AppError('Page must be a positive integer', 400, 'INVALID_PAGE');
  }

  if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new AppError('Limit must be between 1 and 100', 400, 'INVALID_LIMIT');
  }

  return { page: parsedPage, limit: parsedLimit };
};

const canAccessUnpublishedArticle = (
  article: { published: boolean; meta: { userId: string } },
  user?: AuthRequest['user']
) => {
  if (article.published) {
    return true;
  }

  if (!user) {
    return false;
  }

  return article.meta.userId === user.userId || user.role === 'admin';
};

const normalizeSearchText = (value: string) =>
  value
    .replace(/[#>*_`~[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildSnippet = (article: Pick<IArticle, 'content' | 'description'>, keyword: string) => {
  const baseText = normalizeSearchText(article.content || article.description);

  if (!baseText) {
    return '';
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  const matchIndex = baseText.toLowerCase().indexOf(normalizedKeyword);

  if (matchIndex === -1) {
    return baseText.slice(0, 140);
  }

  const start = Math.max(0, matchIndex - 30);
  const end = Math.min(baseText.length, matchIndex + keyword.length + 90);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < baseText.length ? '...' : '';

  return `${prefix}${baseText.slice(start, end)}${suffix}`;
};

const sanitizeArticlePayload = (
  meta: ArticleMetaInput,
  author: Pick<IArticle['meta'], 'userId' | 'username'>,
  description: string,
  content: string
) => ({
  meta: {
    ...author,
    title: sanitizeArticleText(meta.title),
    category: sanitizeArticleText(meta.category || ''),
    tags: sanitizeArticleTags(meta.tags),
  },
  description: sanitizeArticleText(description),
  content: sanitizeArticleContent(content),
});

const getAuthorSnapshot = async (userId: string) => {
  const author = await User.findById(userId).select('username').lean<{ username: string } | null>();

  if (!author) {
    throw new AppError('Author not found', 404, 'AUTHOR_NOT_FOUND');
  }

  return {
    userId,
    username: sanitizeArticleText(author.username),
  };
};

export const getAllArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const { page: parsedPage, limit: parsedLimit } = validateQueryParams(page as string, limit as string);
    const query = { published: true };
    const options = {
      page: parsedPage,
      limit: parsedLimit,
      select: ARTICLE_LIST_FIELDS,
      sort: { 'meta.updatedAt': -1 as const },
    };

    const { items: articles, total } = await paginateQuery<IArticle, ArticleResponse>(Article, query, options);
    sendResponse(res, { articles, total });
  } catch (error) {
    handleError(res, error, req);
  }
};

export const getArticleById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { articleId } = req.params;

    if (!articleId) {
      throw new AppError('Article ID is required', 400, 'MISSING_ID');
    }

    const article = await Article.findOne({ articleId }).select(ARTICLE_DETAILS_FIELDS).lean<ArticleResponse>();

    if (!article) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    if (!canAccessUnpublishedArticle(article, req.user)) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    if (!article.published) {
      sendResponse(res, { article });
      return;
    }

    const articleWithViews = await Article.findOneAndUpdate(
      { articleId, published: true },
      { $inc: { 'stats.views': 1 } },
      { new: true }
    )
      .select(ARTICLE_DETAILS_FIELDS)
      .lean<ArticleResponse>();

    sendResponse(res, { article: articleWithViews ?? article });
  } catch (error) {
    handleError(res, error, req);
  }
};

export const createArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { meta, content, description, published } = req.body as ArticleRequestBody;

    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!meta?.title) {
      throw new AppError('Article title is required', 400, 'MISSING_TITLE');
    }

    const authorSnapshot = await getAuthorSnapshot(req.user.userId);
    const sanitizedPayload = sanitizeArticlePayload(
      {
        title: meta.title,
        tags: meta.tags ?? [],
        category: meta.category ?? '',
      },
      authorSnapshot,
      description || 'No description provided',
      content || ''
    );

    const newArticle = new Article({
      articleId: uuidv4(),
      meta: {
        ...sanitizedPayload.meta,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      content: sanitizedPayload.content,
      description: sanitizedPayload.description,
      published: published || false,
    });

    const article = await newArticle.save();
    sendResponse(res, { article: article.toObject() }, 201);
  } catch (error) {
    handleError(res, error, req);
  }
};

export const updateArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { articleId } = req.params;
    const { meta, content, description, published } = req.body as ArticleRequestBody;

    if (!articleId) {
      throw new AppError('Article ID is required', 400, 'MISSING_ID');
    }

    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const article = await Article.findOne({ articleId }).lean<IArticle>();

    if (!article) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    if (article.meta.userId !== req.user.userId && req.user.role === 'user') {
      throw new AppError('Forbidden to update this article', 403, 'FORBIDDEN');
    }

    const sanitizedData: Partial<IArticle> = {};

    if (meta) {
      const authorSnapshot = await getAuthorSnapshot(article.meta.userId);
      const mergedMeta = {
        title: article.meta.title,
        tags: article.meta.tags,
        category: article.meta.category,
        ...meta,
      };

      sanitizedData.meta = {
        ...sanitizeArticlePayload(
          {
            title: mergedMeta.title,
            tags: mergedMeta.tags ?? [],
            category: mergedMeta.category ?? '',
          },
          authorSnapshot,
          article.description,
          article.content
        ).meta,
        updatedAt: new Date(),
        createdAt: article.meta.createdAt,
      };
    }

    if (typeof content === 'string') {
      sanitizedData.content = sanitizeArticleContent(content);
    }

    if (typeof description === 'string') {
      sanitizedData.description = sanitizeArticleText(description);
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
      throw new AppError('Failed to update article', 500, 'UPDATE_FAILED');
    }

    sendResponse(res, { article: updatedArticle });
  } catch (error) {
    handleError(res, error, req);
  }
};

export const deleteArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { articleId } = req.params;

    if (!articleId) {
      throw new AppError('Article ID is required', 400, 'MISSING_ID');
    }

    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const article = await Article.findOne({ articleId }).lean<IArticle>();

    if (!article) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    if (article.meta.userId !== req.user.userId && req.user.role === 'user') {
      throw new AppError('Forbidden to delete this article', 403, 'FORBIDDEN');
    }

    await Article.deleteOne({ articleId });
    sendResponse(res, { articleId });
  } catch (error) {
    handleError(res, error, req);
  }
};

export const getArticlesByTagsAndCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tags, category, page = '1', limit = '10' } = req.query;
    const { page: parsedPage, limit: parsedLimit } = validateQueryParams(page as string, limit as string);
    const tagsArray = Array.isArray(tags) ? tags : tags ? (tags as string).split(',') : [];
    const query: Record<string, unknown> = { published: true };

    if (tagsArray.length > 0) {
      query['meta.tags'] = { $all: tagsArray };
    }

    if (category) {
      query['meta.category'] = category;
    }

    const options = {
      page: parsedPage,
      limit: parsedLimit,
      select: ARTICLE_LIST_FIELDS,
      sort: { 'meta.updatedAt': -1 as const },
    };

    const { items: articles, total } = await paginateQuery<IArticle, ArticleResponse>(Article, query, options);
    sendResponse(res, { articles, total });
  } catch (error) {
    handleError(res, error, req);
  }
};

export const getArticleByUserId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, page = '1', limit = '10', published = 'all' } = req.query;

    if (!userId) {
      throw new AppError('Author ID is required', 400, 'MISSING_AUTHOR_ID');
    }

    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (req.user.userId !== userId && req.user.role !== 'admin') {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    const query: Record<string, unknown> = { 'meta.userId': userId };
    if (published !== 'all') {
      query.published = published === 'true';
    }

    const { page: parsedPage, limit: parsedLimit } = validateQueryParams(page as string, limit as string);
    const options = {
      page: parsedPage,
      limit: parsedLimit,
      select: ARTICLE_LIST_FIELDS,
      sort: { 'meta.updatedAt': -1 as const },
    };

    const { items: articles, total } = await paginateQuery<IArticle, ArticleResponse>(Article, query, options);
    sendResponse(res, { articles, total });
  } catch (error) {
    handleError(res, error, req);
  }
};

export const searchArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword = '', page = '1', limit = '10' } = req.query;
    const normalizedKeyword = (keyword as string).trim();

    if (!normalizedKeyword) {
      throw new AppError('Keyword is required', 400, 'MISSING_KEYWORD');
    }

    const { page: parsedPage, limit: parsedLimit } = validateQueryParams(page as string, limit as string);
    const publishedArticles = await Article.find({ published: true })
      .select(ARTICLE_DETAILS_FIELDS)
      .sort({ 'meta.updatedAt': -1 })
      .lean<IArticle[]>();

    const searchPosts = publishedArticles.map((article) => ({
      id: article.articleId,
      title: article.meta.title,
      content: `${article.description}\n${article.content || ''}`,
      category: article.meta.category,
      tags: article.meta.tags,
    }));

    const fuzzyResults = fuzzySearch(
      normalizedKeyword,
      searchPosts,
      ['title', 'content', 'category', 'tags'],
      66
    );

    const exactKeyword = normalizedKeyword.toLowerCase();
    const articleMap = new Map(publishedArticles.map((article) => [article.articleId, article]));
    const scoreMap = new Map<string, { score: number; snippet: string }>();

    publishedArticles.forEach((article) => {
      const searchableText = [
        article.meta.title,
        article.description,
        article.content,
        article.meta.category,
        article.meta.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase();

      if (searchableText.includes(exactKeyword)) {
        scoreMap.set(article.articleId, {
          score: 100,
          snippet: buildSnippet(article, normalizedKeyword),
        });
      }
    });

    fuzzyResults.forEach((result) => {
      const matchedArticle = articleMap.get(result.id);

      if (!matchedArticle) {
        return;
      }

      const existing = scoreMap.get(result.id);
      const nextScore = Math.round(result.score);

      if (!existing || nextScore > existing.score) {
        scoreMap.set(result.id, {
          score: nextScore,
          snippet: buildSnippet(matchedArticle, normalizedKeyword),
        });
      }
    });

    const sortedResults = Array.from(scoreMap.entries()).sort((left, right) => {
      if (right[1].score !== left[1].score) {
        return right[1].score - left[1].score;
      }

      const leftArticle = articleMap.get(left[0]);
      const rightArticle = articleMap.get(right[0]);
      const leftTime = leftArticle ? new Date(leftArticle.meta.updatedAt).getTime() : 0;
      const rightTime = rightArticle ? new Date(rightArticle.meta.updatedAt).getTime() : 0;

      return rightTime - leftTime;
    });

    const start = (parsedPage - 1) * parsedLimit;
    const paginatedResults: SearchArticleResponse[] = sortedResults
      .slice(start, start + parsedLimit)
      .map(([articleId, meta]) => {
        const article = articleMap.get(articleId);

        if (!article) {
          throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
        }

        return {
          article,
          snippet: meta.snippet || article.description,
          score: meta.score,
        };
      });

    sendResponse(res, {
      keyword: normalizedKeyword,
      total: sortedResults.length,
      results: paginatedResults,
    });
  } catch (error) {
    handleError(res, error, req);
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Article.distinct('meta.category', { published: true });
    sendResponse(res, { categories });
  } catch (error) {
    handleError(res, error, req);
  }
};

export const getCategoryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [stats, total] = await Promise.all([
      Article.aggregate<{ _id: string; count: number }>([
        { $match: { published: true } },
        {
          $group: {
            _id: '$meta.category',
            count: { $sum: 1 },
          },
        },
      ]),
      Article.countDocuments({ published: true }),
    ]);

    const counts = stats.reduce<Record<string, number>>((acc, item) => {
      if (item._id) {
        acc[item._id] = item.count;
      }

      return acc;
    }, {});

    sendResponse(res, { counts, total });
  } catch (error) {
    handleError(res, error, req);
  }
};
