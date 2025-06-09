import { AxiosError, AxiosResponse } from 'axios';
import { message } from 'antd';
import api, { CustomAxiosRequestConfig } from './axios';
import {
  Article,
  CreateArticleRequest,
  PaginatedResponse,
  Image,
  updateArticleRequest,
} from '../type/articles';
import { ApiResponse, ErrorResponse } from '../type/api';

// 请求参数类型
interface GetArticlesParams {
  page?: number;
  limit?: number;
}

interface GetMyArticlesParams extends GetArticlesParams {
  published?: 'true' | 'false' | 'all';
}

// 默认请求配置
const defaultConfig: CustomAxiosRequestConfig = {
  retry: 1,
  retryDelay: 1000,
};

// 通用请求函数
const request = async <T, D = any>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: D,
  config: CustomAxiosRequestConfig<D> = defaultConfig
): Promise<T> => {
  try {
    const response = await api.request<ApiResponse<T>, AxiosResponse<ApiResponse<T>>, D>({
      method,
      url,
      data,
      headers: config.headers,
      signal: config.signal,
      retry: config.retry,
      retryDelay: config.retryDelay,
    });
    if (response.data.error) {
      throw new Error(response.data.error.message);
    }
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    if (axiosError.code === 'ERR_CANCELED') {
      throw new Error('Request canceled by user');
    }
    let errorMessage = '操作失败';
    if (axiosError.response) {
      errorMessage = axiosError.response.data.error?.message || errorMessage;
    } else if (axiosError.request) {
      errorMessage = '网络错误，请检查连接';
    }
    message.error(errorMessage);
    throw axiosError; // 让 axios.ts 拦截器处理 401
  }
};

// 获取所有文章
export const getArticlesApi = async (
  params: GetArticlesParams = {},
  options: CustomAxiosRequestConfig = defaultConfig
): Promise<PaginatedResponse> => {
  const { page = 1, limit = 10 } = params;
  return request<PaginatedResponse>(
    'get',
    `/articles?page=${page}&limit=${limit}`,
    undefined,
    options
  );
};

// 获取单篇文章
export const getArticleByIdApi = async (
  articleId: string,
  options: CustomAxiosRequestConfig = defaultConfig
): Promise<Article> => {
  const response = await request<{ article: Article }>(
    'get',
    `/articles/${articleId}`,
    undefined,
    options
  );
  return response.article;
};

// 获取我的文章
export const getMyArticlesApi = async (
  userId: string,
  params: GetMyArticlesParams = {},
  options: CustomAxiosRequestConfig = defaultConfig
): Promise<PaginatedResponse> => {
  const { page = 1, limit = 10, published = 'all' } = params;
  return request<PaginatedResponse>(
    'get',
    `/articles/byAuthor?userId=${userId}&page=${page}&limit=${limit}&published=${published}`,
    undefined,
    options
  );
};

//更新文章
export const updateArticleApi = async (
  articleId: string,
  article: updateArticleRequest,
  options: CustomAxiosRequestConfig = defaultConfig
): Promise<void> => {
  await request<{ article: Article }, updateArticleRequest>(
    'put',
    `/articles/${articleId}`,
    article,
    options
  );
}

// 删除文章
export const deleteArticleApi = async (
  id: string,
  options: CustomAxiosRequestConfig = defaultConfig
): Promise<{ articleId: string}> => {
  const response = await request<{ articleId: string }>('delete', `/articles/${id}`, undefined, options);
  message.success('文章删除成功');
  return response;
};

// 创建文章
export const createArticleApi = async (
  article: CreateArticleRequest,
  options: CustomAxiosRequestConfig = defaultConfig
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

// 上传图片
export const uploadImagesApi = async (
  formData: FormData,
  options: CustomAxiosRequestConfig = defaultConfig
): Promise<string> => {
  const response = await request<{ url: string }>(
    'post',
    '/img/upload',
    formData,
    {
      ...options,
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.url;
};

// 删除图片
export const deleteImagesApi = async (
  images: Image[],
  options: CustomAxiosRequestConfig = defaultConfig
): Promise<void> => {
  await request<{ message: string }, { images: Image[] }>('delete', '/img/delete', { images }, options);
  message.success('图片删除成功');
};