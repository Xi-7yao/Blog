import JaroWinkler from 'string-comparison';
import pinyin from 'pinyinlite';

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  category: string;
  tags: string[];
  score: number;
}

// 简单分词（按空格、标点或逐字）
function simpleTokenize(text: string): string[] {
  return text
    .split(/[\s,.!?;，。！？；]+/)
    .filter((token) => token)
    .concat(Array.from(text));
}

export function fuzzySearch(
  query: string,
  posts: Array<{ id: string; title: string; content: string; category: string; tags: string[] }>,
  fields: string[] = ['title', 'content', 'category', 'tags'],
  threshold: number = 70
): SearchResult[] {
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();
  const queryTokens = simpleTokenize(queryLower);
  // 查询转拼音
  const queryPinyin = pinyin(query)
    .flat()
    .join('');

  for (const post of posts) {
    const titleTokens = fields.includes('title') ? simpleTokenize(post.title.toLowerCase()) : [];
    const contentTokens = fields.includes('content') ? simpleTokenize(post.content.slice(0, 500).toLowerCase()) : [];
    const categoryTokens = fields.includes('category') ? simpleTokenize(post.category.toLowerCase()) : [];
    const titlePinyin = fields.includes('title')
      ? pinyin(post.title)
          .flat()
          .join('')
      : '';
    const categoryPinyin = fields.includes('category')
      ? pinyin(post.category)
          .flat()
          .join('')
      : '';

    let score = 0;

    // === 精确搜索部分 ===
    // 1. 分词完全匹配
    if (
      queryTokens.some(
        (qt: string) =>
          titleTokens.includes(qt) ||
          contentTokens.includes(qt) ||
          categoryTokens.includes(qt) ||
          post.tags.map((t) => t.toLowerCase()).includes(qt)
      )
    ) {
      score = Math.max(score, 90); // 精确：分词匹配，赋予高分
    }

    // === 模糊搜索部分 ===
    // 2. 字符串模糊匹配（使用 Jaro-Winkler）
    if (fields.includes('title')) {
      const similarity = JaroWinkler.jaroWinkler.similarity(queryLower, post.title.toLowerCase());
      score = Math.max(score, similarity * 100);
    }
    if (fields.includes('content')) {
      const similarity = JaroWinkler.jaroWinkler.similarity(queryLower, post.content.slice(0, 500).toLowerCase());
      score = Math.max(score, similarity * 100);
    }
    if (fields.includes('category')) {
      const similarity = JaroWinkler.jaroWinkler.similarity(queryLower, post.category.toLowerCase());
      score = Math.max(score, similarity * 100);
    }
    if (fields.includes('tags')) {
      const tagSimilarities = post.tags.map((tag) => JaroWinkler.jaroWinkler.similarity(queryLower, tag.toLowerCase()));
      score = Math.max(score, ...tagSimilarities.map((s) => s * 100));
    }

    // 3. 拼音匹配
    if (queryPinyin) {
      if (titlePinyin && fields.includes('title')) {
        const similarity = JaroWinkler.jaroWinkler.similarity(queryPinyin, titlePinyin);
        score = Math.max(score, similarity * 100);
      }
      if (categoryPinyin && fields.includes('category')) {
        const similarity = JaroWinkler.jaroWinkler.similarity(queryPinyin, categoryPinyin);
        score = Math.max(score, similarity * 100);
      }
      if (fields.includes('tags')) {
        const tagPinyinSimilarities = post.tags.map((tag) =>
          JaroWinkler.jaroWinkler.similarity(queryPinyin, pinyin(tag).flat().join(''))
        );
        score = Math.max(score, ...tagPinyinSimilarities.map((s) => s * 100));
      }
    }

    // 收集结果
    if (score >= threshold) {
      const snippet = post.content.slice(0, 100) + (post.content.length > 100 ? '...' : '');
      results.push({ id: post.id, title: post.title, snippet, category: post.category, tags: post.tags, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}