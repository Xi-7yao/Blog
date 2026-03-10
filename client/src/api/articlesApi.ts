import { AxiosError } from 'axios';
import { message } from 'antd';
import { requestApi, CustomAxiosRequestConfig } from './axios';
import {
  Article,
  CreateArticleRequest,
  PaginatedResponse,
  Image,
  SearchArticlesResponse,
  updateArticleRequest,
} from '../type/articles';
import { ApiResponse, ErrorResponse } from '../type/api';

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

const defaultConfig: CustomAxiosRequestConfig = {
  retry: 1,
  retryDelay: 1000,
};

const getRequestErrorMessage = (
  error: AxiosError<ErrorResponse>,
  fallback = '操作失败'
) => {
  if (error.response) {
    return error.response.data.error?.message || fallback;
  }

  if (error.request) {
    return '网络错误，请检查连接';
  }

  return fallback;
};

const request = async <T, D = unknown>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: D,
  config?: CustomAxiosRequestConfig<D>
): Promise<T> => {
  const mergedConfig: CustomAxiosRequestConfig<D> = {
    retry: defaultConfig.retry,
    retryDelay: defaultConfig.retryDelay,
    ...config,
  };

  try {
    const response = await requestApi<ApiResponse<T>, D>({
      method,
      url,
      data,
      headers: mergedConfig.headers,
      signal: mergedConfig.signal,
      retry: mergedConfig.retry,
      retryDelay: mergedConfig.retryDelay,
    });

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    return response.data.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<ErrorResponse>;

    if (axiosError.code === 'ERR_CANCELED') {
      throw new Error('Request canceled by user');
    }

    message.error(getRequestErrorMessage(axiosError));
    throw axiosError;
  }
};

export const getArticlesApi = async (
  params: GetArticlesParams = {},
  options?: CustomAxiosRequestConfig
): Promise<PaginatedResponse> => {
  const { page = 1, limit = 10 } = params;
  return request<PaginatedResponse>(
    'get',
    `/articles?page=${page}&limit=${limit}`,
    undefined,
    options
  );
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

export const updateArticleApi = async (
  articleId: string,
  article: updateArticleRequest,
  options?: CustomAxiosRequestConfig<updateArticleRequest>
): Promise<void> => {
  await request<{ article: Article }, updateArticleRequest>(
    'put',
    `/articles/${articleId}`,
    article,
    options
  );
};

export const deleteArticleApi = async (
  id: string,
  options?: CustomAxiosRequestConfig
): Promise<{ articleId: string }> => {
  const response = await request<{ articleId: string }>(
    'delete',
    `/articles/${id}`,
    undefined,
    options
  );
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
  message.success('文章发布成功');
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
  await request<{ message: string }, { images: Image[] }>(
    'delete',
    '/img/delete',
    { images },
    options
  );
  message.success('图片删除成功');
};
