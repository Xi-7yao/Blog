import { AxiosError } from 'axios';
import { CreateArticleRequest, Image } from '../../type/articles';
import { ErrorResponse } from '../../type/api';
import { CATEGORY_ALL } from '../../redux/slices/articlesSlice';

export interface TempImage {
  id?: string;
  url: string;
  title?: string;
  alt?: string;
}

export interface PublishFormValues {
  title: string;
  category: string;
  tags?: string[];
  description?: string;
}

export const MIN_SAVING_DURATION = 700;

export const SAVE_STATUS_RESET_DELAY = 5000;

export const getApiErrorCode = (error: unknown) => {
  const axiosError = error as AxiosError<ErrorResponse>;
  return axiosError.response?.data?.error?.code || 'UNKNOWN';
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  const axiosError = error as AxiosError<ErrorResponse>;
  return axiosError.response?.data?.error?.message || fallback;
};

export const shouldOpenLogin = (error: unknown) => {
  const errorCode = getApiErrorCode(error);
  return errorCode === 'MISSING_TOKEN' || errorCode === 'TOKEN_EXPIRED' || errorCode === 'UNAUTHORIZED';
};

export const normalizeImageDeletePayload = (images: TempImage[]): Image[] =>
  images.map((image, index) => ({
    id: image.id || `${index}`,
    url: image.url,
  }));

export const buildArticlePayload = ({
  title,
  username,
  userId,
  tags,
  category,
  content,
  description,
  published,
}: {
  title: string;
  username: string;
  userId: string;
  tags: string[];
  category: string;
  content: string;
  description: string;
  published: boolean;
}): CreateArticleRequest => ({
  meta: {
    title: title.trim() || '未命名文章',
    username,
    userId,
    tags,
    category: category || CATEGORY_ALL,
  },
  content,
  description: description.trim() || '作者还没有补充摘要',
  published,
});

export const waitForMinimumDuration = async (startTime: number, minimumDuration = MIN_SAVING_DURATION) => {
  const duration = Date.now() - startTime;

  if (duration < minimumDuration) {
    await new Promise((resolve) => setTimeout(resolve, minimumDuration - duration));
  }
};

export const debounce = <Args extends unknown[]>(
  func: (...args: Args) => void | Promise<void>,
  wait: number
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Args) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      void func(...args);
      timeout = null;
    }, wait);
  };
};
