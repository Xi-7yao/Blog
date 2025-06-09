import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Article, CreateArticleRequest } from '../../type/articles';
import { getArticlesApi, deleteArticleApi, createArticleApi, getArticleByIdApi, getMyArticlesApi } from '../../api/articlesApi';

// 定义 ArticlesState 接口
interface ArticlesState {
  articles: { [articleId: string]: Article }; // 所有文章
  myArticles: { [articleId: string]: Article }; // 用户的文章
  selectedCategory: string; // 当前选中的分类
  categories: string[]; // 分类列表
  currentArticle: Article | null; // 当前查看的文章
  status: 'idle' | 'loading' | 'succeeded' | 'failed'; // 异步状态
  error: string | null; // 错误信息
}

// 初始状态
const initialState: ArticlesState = {
  articles: {},
  myArticles: {},
  selectedCategory: '综合', // 默认选中“综合”
  categories: ['综合', '前端', '后端', '数据库', '运维', '其他'], // 包含“综合”
  currentArticle: null,
  status: 'idle',
  error: null,
};

// 异步操作：获取所有文章
export const fetchArticles = createAsyncThunk(
  'articles/fetchArticles',
  async (args: { page?: number; limit?: number } = {}) => {
    const { page = 1, limit = 10 } = args;
    const response = await getArticlesApi({page, limit});
    return response; // 假设返回 { articles: Article[] }
  }
);

// 异步操作：根据 ID 获取文章
export const fetchArticlesById = createAsyncThunk(
  'articles/fetchArticlesById',
  async (articleId: string) => {
    const response = await getArticleByIdApi(articleId);
    return response; // 假设返回 Article
  }
);

// 异步操作：获取用户文章
export const fetchMyArticles = createAsyncThunk(
  'articles/fetchMyArticles',
  async (userId: string) => {
    const response = await getMyArticlesApi(userId);
    return response;
  }
);

// 异步操作：删除文章
export const deleteArticle = createAsyncThunk(
  'articles/deleteArticle',
  async (id: string) => {
    const response = await deleteArticleApi(id);
    return response.articleId;
  }
);

// 异步操作：创建文章
export const createArticle = createAsyncThunk(
  'articles/createArticle',
  async (article: CreateArticleRequest) => {
    const response = await createArticleApi(article);
    return response; // 假设返回 Article
  }
);

// 创建 Slice
const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    // 设置选中的分类
    setSelectedCategory(state, action: PayloadAction<string>) {
      state.selectedCategory = action.payload;
    },
    // 可选：重置状态
    resetArticlesState(state) {
      state.articles = {};
      state.myArticles = {};
      state.selectedCategory = '综合';
      state.currentArticle = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchArticles
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // 将文章存储为对象，键为 ID
        state.articles = action.payload.articles.reduce(
          (acc: { [articleId: string]: Article }, article: Article) => {
            acc[article.articleId] = article;
            return acc;
          },
          {} // 清除旧文章
        );
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || '获取文章失败';
      });

    // fetchArticlesById
    builder
      .addCase(fetchArticlesById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchArticlesById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.articles[action.payload.articleId] = action.payload;
        state.currentArticle = action.payload; // 根据 API 响应调整
      })
      .addCase(fetchArticlesById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || '获取文章详情失败';
      });

    // fetchMyArticles
    builder
      .addCase(fetchMyArticles.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMyArticles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.myArticles = action.payload.articles.reduce(
          (acc: { [articleId: string]: Article }, article: Article) => {
            acc[article.articleId] = article;
            return acc;
          },
          { ...state.myArticles }
        );
      })
      .addCase(fetchMyArticles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || '获取我的文章失败';
      });

    // deleteArticle
    builder
      .addCase(deleteArticle.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteArticle.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const deleteId = action.payload;
        delete state.articles[deleteId];
        delete state.myArticles[deleteId];
      })
      .addCase(deleteArticle.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || '删除文章失败';
      });

    // createArticle
    builder
      .addCase(createArticle.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createArticle.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const newArticle = action.payload;
        state.articles[newArticle.articleId] = newArticle;
        state.myArticles[newArticle.articleId] = newArticle;
      })
      .addCase(createArticle.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || '创建文章失败';
      });
  },
});

export const { setSelectedCategory, resetArticlesState } = articlesSlice.actions;
export default articlesSlice.reducer;