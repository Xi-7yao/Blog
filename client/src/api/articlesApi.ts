import { message } from 'antd';
import { CustomAxiosRequestConfig } from './axios';
import { request } from './request';
import {
  Article,
  CreateArticleRequest,
  Image,
  PaginatedResponse,
  SearchArticlesResponse,
  UpdateArticleRequest,
} from '../type/articles';

interface GetArticlesParams {
  page?: number;
  limit?: number;
}

interface GetMyArticlesParams extends GetArticlesParams {
  published?: 'true' | 'false' | 'all';
}

interface SearchArticlesParams extends GetArticlesParams {
  keyword: string;
}

interface FilterArticlesParams extends GetArticlesParams {
  category?: string;
}

export interface CategoryStatsResponse {
  total: number;
  counts: Record<string, number>;
}

export const getArticlesApi = async (
  params: GetArticlesParams = {},
  options?: CustomAxiosRequestConfig
): Promise<PaginatedResponse> => {
  const { page = 1, limit = 10 } = params;

  return request<PaginatedResponse>('get', `/articles?page=${page}&limit=${limit}`, undefined, options);
};

export const getFilteredArticlesApi = async (
  params: FilterArticlesParams = {},
  options?: CustomAxiosRequestConfig
): Promise<PaginatedResponse> => {
  const { page = 1, limit = 10, category } = params;
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (category) {
    query.set('category', category);
  }

  return request<PaginatedResponse>('get', `/articles/filter?${query.toString()}`, undefined, options);
};

export const getArticleByIdApi = async (
  articleId: string,
  options?: CustomAxiosRequestConfig
): Promise<Article> => {
  const response = await request<{ article: Article }>(
    'get',
    `/articles/${articleId}`,
    undefined,
    options
  );

  return response.article;
};

export const searchArticlesApi = async (
  params: SearchArticlesParams,
  options?: CustomAxiosRequestConfig
): Promise<SearchArticlesResponse> => {
  const { keyword, page = 1, limit = 10 } = params;
  const encodedKeyword = encodeURIComponent(keyword.trim());

  return request<SearchArticlesResponse>(
    'get',
    `/articles/search?keyword=${encodedKeyword}&page=${page}&limit=${limit}`,
    undefined,
    options
  );
};

export const getMyArticlesApi = async (
  userId: string,
  params: GetMyArticlesParams = {},
  options?: CustomAxiosRequestConfig
): Promise<PaginatedResponse> => {
  const { page = 1, limit = 10, published = 'all' } = params;

  return request<PaginatedResponse>(
    'get',
    `/articles/byAuthor?userId=${userId}&page=${page}&limit=${limit}&published=${published}`,
    undefined,
    options
  );
};

export const getCategoryStatsApi = async (
  options?: CustomAxiosRequestConfig
): Promise<CategoryStatsResponse> => {
  return request<CategoryStatsResponse>('get', '/articles/categories/stats', undefined, options);
};

export const updateArticleApi = async (
  articleId: string,
  article: UpdateArticleRequest,
  options?: CustomAxiosRequestConfig<UpdateArticleRequest>
): Promise<void> => {
  await request<{ article: Article }, UpdateArticleRequest>('put', `/articles/${articleId}`, article, options);
};

export const deleteArticleApi = async (
  id: string,
  options?: CustomAxiosRequestConfig
): Promise<{ articleId: string }> => {
  const response = await request<{ articleId: string }>('delete', `/articles/${id}`, undefined, options);
  message.success('文章删除成功');
  return response;
};

export const createArticleApi = async (
  article: CreateArticleRequest,
  options?: CustomAxiosRequestConfig<CreateArticleRequest>
): Promise<Article> => {
  const response = await request<{ article: Article }, CreateArticleRequest>(
    'post',
    '/articles',
    article,
    options
  );
  return response.article;
};

export const uploadImagesApi = async (
  formData: FormData,
  options?: CustomAxiosRequestConfig<FormData>
): Promise<string> => {
  const response = await request<{ url: string }, FormData>('post', '/img/upload', formData, {
    ...options,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.url;
};

export const deleteImagesApi = async (
  images: Image[],
  options?: CustomAxiosRequestConfig<{ images: Image[] }>
): Promise<void> => {
  await request<{ message: string }, { images: Image[] }>('delete', '/img/delete', { images }, options);
};
