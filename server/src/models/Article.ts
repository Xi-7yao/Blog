import mongoose, { Document, Schema } from 'mongoose';

export interface IArticleMeta {
  title: string;
  username: string;
  userId: string;
  tags: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IArticleStats {
  views: number;
}

export interface IArticle extends Document {
  articleId: string;
  meta: IArticleMeta;
  description: string;
  content: string;
  published: boolean;
  stats: IArticleStats;
}

const ArticleMetaSchema = new Schema<IArticleMeta>(
  {
    title: { type: String, required: true, minlength: 1, maxlength: 100 },
    username: { type: String, required: true, minlength: 1, maxlength: 50 },
    userId: { type: String, required: true },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.every((tag) => tag.length > 0 && tag.length <= 50),
        message: 'Tag must not be empty and must be 50 characters or fewer',
      },
    },
    category: { type: String, default: '', maxlength: 50 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ArticleStatsSchema = new Schema<IArticleStats>(
  {
    views: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const ArticleSchema = new Schema<IArticle>(
  {
    articleId: { type: String, unique: true, required: true },
    meta: { type: ArticleMetaSchema, required: true },
    content: { type: String, minlength: 0, maxlength: 10000 },
    description: { type: String, required: true, minlength: 1, maxlength: 500 },
    published: { type: Boolean, default: false, required: true },
    stats: { type: ArticleStatsSchema, default: () => ({ views: 0 }), required: true },
  },
  { collection: 'articles' }
);

ArticleSchema.index({ 'meta.userId': 1, 'meta.createdAt': -1 });
ArticleSchema.index({ published: 1 });
ArticleSchema.index({ published: 1, 'meta.updatedAt': -1 });
ArticleSchema.index({ 'meta.tags': 1 });
ArticleSchema.index({ 'meta.category': 1 });
ArticleSchema.index({ 'stats.views': -1 });

export default mongoose.model<IArticle>('Article', ArticleSchema);
