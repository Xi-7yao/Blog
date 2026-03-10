import express from 'express';
import {
  createArticle,
  deleteArticle,
  getAllArticles,
  getArticleById,
  getArticleByUserId,
  getArticlesByTagsAndCategories,
  getCategories,
  searchArticles,
  updateArticle,
} from '../controllers/articleController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = express.Router();

router.route('/').get(getAllArticles).post(authMiddleware, createArticle);
router.route('/filter').get(getArticlesByTagsAndCategories);
router.route('/categories').get(getCategories);
router.route('/search').get(searchArticles);
router.route('/byAuthor').get(authMiddleware, getArticleByUserId);

router
  .route('/:articleId')
  .get(optionalAuthMiddleware, getArticleById)
  .put(authMiddleware, updateArticle)
  .delete(authMiddleware, deleteArticle);

export default router;
