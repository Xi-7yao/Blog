import sanitizeHtml from 'sanitize-html';

const ARTICLE_ALLOWED_TAGS = [
  ...sanitizeHtml.defaults.allowedTags,
  'img',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'pre',
  'code',
  'blockquote',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

const ARTICLE_ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'name', 'target', 'rel'],
  img: ['src', 'alt', 'title'],
  code: ['class'],
  '*': ['id'],
};

const sanitizePlainText = (value: string) =>
  sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

export const sanitizeArticleContent = (value: string) =>
  sanitizeHtml(value, {
    allowedTags: ARTICLE_ALLOWED_TAGS,
    allowedAttributes: ARTICLE_ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
    },
  }).trim();

export const sanitizeArticleText = (value: string) => sanitizePlainText(value);

export const sanitizeArticleTags = (tags: string[] = []) =>
  tags.map((tag) => sanitizePlainText(tag)).filter(Boolean);
