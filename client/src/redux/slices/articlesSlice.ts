import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Article, CreateArticleRequest } from '../../type/articles';
import {
  createArticleApi,
  deleteArticleApi,
  getArticleByIdApi,
  getArticlesApi,
  getFilteredArticlesApi,
  getMyArticlesApi,
} from '../../api/articlesApi';

export const CATEGORY_ALL = '综合';
export const DEFAULT_CATEGORIES = [CATEGORY_ALL, '前端', '后端', '数据库', '运维', '其他'];

interface ArticlesState {
  articles: Record<string, Article>;
  articlesTotal: number;
  myArticles: Record<string, Article>;
  myArticlesTotal: number;
  selectedCategory: string;
  categories: string[];
  currentArticle: Article | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ArticlesState = {
  articles: {},
  articlesTotal: 0,
  myArticles: {},
  myArticlesTotal: 0,
  selectedCategory: CATEGORY_ALL,
  categories: DEFAULT_CATEGORIES,
  currentArticle: null,
  status: 'idle',
  error: null,
};

export const fetchArticles = createAsyncThunk(
  'articles/fetchArticles',
  async (args: { page?: number; limit?: number; category?: string } = {}) => {
    const { page = 1, limit = 10, category } = args;

    if (category && category !== CATEGORY_ALL) {
      return getFilteredArticlesApi({ page, limit, category });
    }

    return getArticlesApi({ page, limit });
  }
);

export const fetchArticlesById = createAsyncThunk('articles/fetchArticlesById', async (articleId: string) => {
  return getArticleByIdApi(articleId);
});

export const fetchMyArticles = createAsyncThunk(
  'articles/fetchMyArticles',
  async (
    args: { userId: string; page?: number; limit?: number; published?: 'true' | 'false' | 'all' }
  ) => {
    const { userId, page = 1, limit = 10, published = 'all' } = args;
    return getMyArticlesApi(userId, { page, limit, published });
  }
);

export const deleteArticle = createAsyncThunk('articles/deleteArticle', async (id: string) => {
  const response = await deleteArticleApi(id);
  return response.articleId;
});

export const createArticle = createAsyncThunk('articles/createArticle', async (article: CreateArticleRequest) => {
  return createArticleApi(article);
});

const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    setSelectedCategory(state, action: PayloadAction<string>) {
      state.selectedCategory = action.payload;
    },
    resetArticlesState(state) {
      state.articles = {};
      state.articlesTotal = 0;
      state.myArticles = {};
      state.myArticlesTotal = 0;
      state.selectedCategory = CATEGORY_ALL;
      state.currentArticle = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.articlesTotal = action.payload.total;
        state.articles = action.payload.articles.reduce<Record<string, Article>>((acc, article) => {
          acc[article.articleId] = article;
          return acc;
        }, {});
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || '获取文章失败';
      })
      .addCase(fetchArticlesById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchArticlesById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.articles[action.payload.articleId] = action.payload;
        state.currentArticle = action.payload;
      })
      .addCase(fetchArticlesById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || '获取文章详情失败';
      })
      .addCase(fetchMyArticles.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMyArticles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.myArticlesTotal = action.payload.total;
        state.myArticles = action.payload.articles.reduce<Record<string, Article>>((acc, article) => {
          acc[article.articleId] = article;
          return acc;
        }, {});
      })
      .addCase(fetchMyArticles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || '获取我的文章失败';
      })
      .addCase(deleteArticle.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteArticle.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (state.articles[action.payload]) {
          state.articlesTotal = Math.max(0, state.articlesTotal - 1);
        }

        if (state.myArticles[action.payload]) {
          state.myArticlesTotal = Math.max(0, state.myArticlesTotal - 1);
        }

        delete state.articles[action.payload];
        delete state.myArticles[action.payload];
      })
      .addCase(deleteArticle.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || '删除文章失败';
      })
      .addCase(createArticle.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createArticle.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.articles[action.payload.articleId] = action.payload;
        state.myArticles[action.payload.articleId] = action.payload;
      })
      .addCase(createArticle.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || '创建文章失败';
      });
  },
});

export const { setSelectedCategory, resetArticlesState } = articlesSlice.actions;
export default articlesSlice.reducer;
