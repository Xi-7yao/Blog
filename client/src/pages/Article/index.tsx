import { useEffect } from 'react';
import { Viewer } from '@bytemd/react';
import gfm from '@bytemd/plugin-gfm';
import 'bytemd/dist/index.css';
import 'github-markdown-css/github-markdown-light.css';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import type { BytemdPlugin } from 'bytemd';
import Details from '../../components/Details';
import { fetchArticlesById } from '../../redux/slices/articlesSlice';
import type { AppDispatch, RootState } from '../../redux/store';
import styles from './index.module.css';

const plugins: BytemdPlugin[] = [gfm()];

const Article = () => {
  const { articleId } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const article = useSelector((state: RootState) => state.articles.currentArticle);
  const status = useSelector((state: RootState) => state.articles.status);
  const error = useSelector((state: RootState) => state.articles.error);

  useEffect(() => {
    if (articleId) {
      void dispatch(fetchArticlesById(articleId));
    }
  }, [articleId, dispatch]);

  return (
    <main className={styles['article-page']}>
      {article ? (
        <section className={styles['article-shell']}>
          <Details article={article} showMenu={false} />

          <section className={styles['article-content-panel']}>
            {article.content ? (
              <div className={`${styles['markdown-body']} markdown-body`}>
                <Viewer value={article.content} plugins={plugins} />
              </div>
            ) : (
              <div className={styles['article-state']}>
                <h2>这篇文章还没有正文内容</h2>
                <p>你可以稍后再回来查看，或者继续完善这篇内容。</p>
              </div>
            )}
          </section>
        </section>
      ) : null}

      {!article && status === 'loading' ? (
        <section className={styles['article-state']}>
          <h2>正在加载文章</h2>
          <p>内容和阅读统计正在同步，请稍等片刻。</p>
        </section>
      ) : null}

      {!article && status === 'failed' ? (
        <section className={styles['article-state']}>
          <h2>文章加载失败</h2>
          <p>{error ?? '请检查网络连接后重试。'}</p>
        </section>
      ) : null}
    </main>
  );
};

export default Article;
