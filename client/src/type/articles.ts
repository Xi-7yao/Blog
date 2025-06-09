export interface ArticleMeta {
  title: string;
  username: string;
  userId: string;
  tags: string[];
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Article {
  articleId: string;
  meta: ArticleMeta;
  description: string;
  content: string;
  published: boolean;
}

export interface CreateArticleRequest {
  meta: ArticleMeta;
  description: string;
  content: string;
  published?: boolean;
}

export interface updateArticleRequest extends CreateArticleRequest {
  
}

export interface PaginatedResponse {
  articles: Article[];
  total: number;
}

export interface Image {
  url: string;
  id: string;
}

export interface currentArticle extends Article {
  
}