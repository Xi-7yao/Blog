import express from 'express';
import {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getArticlesByTagsAndCategories,
  getArticleByUserId,
  getCategories,
} from '../controllers/articleController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 获取所有文章和创建新文章
router
.route('/')
.get(getAllArticles)
.post(authMiddleware, createArticle);

// 按标签和类别过滤文章
router.route('/filter').get(getArticlesByTagsAndCategories);

// 获取所有类别
router.route('/categories').get(getCategories);

// 按作者 ID 获取文章
router.route('/byAuthor').get(authMiddleware, getArticleByUserId);

// 获取、更新、删除单篇文章
router
  .route('/:articleId')
  .get(getArticleById)
  .put(authMiddleware, updateArticle)
  .delete(authMiddleware, deleteArticle);

export default router;