export interface ArticleMeta {
  title: string;
  username: string;
  userId: string;
  tags: string[];
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArticleStats {
  views: number;
}

export interface Article {
  articleId: string;
  meta: ArticleMeta;
  description: string;
  content: string;
  published: boolean;
  stats?: ArticleStats;
}

export interface CreateArticleRequest {
  meta: ArticleMeta;
  description: string;
  content: string;
  published?: boolean;
}

export type updateArticleRequest = CreateArticleRequest;

export interface PaginatedResponse {
  articles: Article[];
  total: number;
}

export interface SearchArticleResult {
  article: Article;
  snippet: string;
  score: number;
}

export interface SearchArticlesResponse {
  keyword: string;
  results: SearchArticleResult[];
  total: number;
}

export interface Image {
  url: string;
  id: string;
}

export type currentArticle = Article;
