import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Details from '../../components/Details';
import LoginModal from '../../components/Login';
import { useAuth } from '../../context/useAuth';
import { fetchMyArticles } from '../../redux/slices/articlesSlice';
import type { AppDispatch, RootState } from '../../redux/store';
import type { Article } from '../../type/articles';
import styles from './index.module.css';

const groupArticlesByYear = (articles: Article[]) => {
  const articleMap = articles.reduce<Record<string, Article[]>>((groups, article) => {
    const year = article.meta.updatedAt?.split('-')[0] ?? '未分组';
    groups[year] = groups[year] ?? [];
    groups[year].push(article);
    return groups;
  }, {});

  return Object.entries(articleMap).sort(([left], [right]) => Number(right) - Number(left));
};

const MyArticle = () => {
  const { userId } = useParams();
  const { user, setIsLoginOpen } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const myArticles = useSelector((state: RootState) =>
    user?.role === 'admin' ? state.articles.articles : state.articles.myArticles
  );
  const status = useSelector((state: RootState) => state.articles.status);

  const ownerId = userId ?? user?.userId;
  const visibleArticles = useMemo(
    () =>
      Object.values(myArticles)
        .filter((article) => article.published)
        .sort(
          (left, right) =>
            new Date(right.meta.updatedAt ?? right.meta.createdAt ?? '').getTime() -
            new Date(left.meta.updatedAt ?? left.meta.createdAt ?? '').getTime()
        ),
    [myArticles]
  );
  const groupedArticles = useMemo(() => groupArticlesByYear(visibleArticles), [visibleArticles]);
  const canManageArticles = Boolean(user && ownerId && (user.userId === ownerId || user.role === 'admin'));

  useEffect(() => {
    if (ownerId) {
      void dispatch(fetchMyArticles(ownerId));
    }
  }, [dispatch, ownerId]);

  useEffect(() => {
    const hash = location.hash.replace('#', '');

    if (!hash) {
      return;
    }

    const element = document.getElementById(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [groupedArticles, location.hash]);

  if (!user) {
    return (
      <main className={styles['archive-page']}>
        <section className={styles['empty-panel']}>
          <span className={styles['eyebrow']}>文章归档</span>
          <h1>登录后查看你的文章时间线</h1>
          <p>这里会展示按年份整理的已发布文章，适合回顾你的内容积累和项目成长轨迹。</p>
          <button className={styles['primary-button']} onClick={() => setIsLoginOpen(true)}>
            登录后继续
          </button>
        </section>
        <LoginModal />
      </main>
    );
  }

  if (status === 'loading' && groupedArticles.length === 0) {
    return (
      <main className={styles['archive-page']}>
        <section className={styles['empty-panel']}>
          <span className={styles['eyebrow']}>文章归档</span>
          <h1>正在加载你的文章</h1>
          <p>我们正在整理最新的发布记录，请稍等一下。</p>
        </section>
      </main>
    );
  }

  if (groupedArticles.length === 0) {
    return (
      <main className={styles['archive-page']}>
        <section className={styles['empty-panel']}>
          <span className={styles['eyebrow']}>文章归档</span>
          <h1>你还没有已发布的文章</h1>
          <p>先写下一篇内容吧。发布后，这里会自动按年份整理，方便展示你的技术沉淀。</p>
          <button className={styles['primary-button']} onClick={() => navigate('/new')}>
            去写第一篇文章
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles['archive-page']}>
      <section className={styles['archive-hero']}>
        <div>
          <span className={styles['eyebrow']}>文章归档</span>
          <h1>{canManageArticles ? '你的文章时间线' : '作者文章时间线'}</h1>
          <p>按年份查看已发布文章，更适合展示长期输出，而不是只看最近一篇。</p>
        </div>
        <div className={styles['hero-stats']}>
          <span>{visibleArticles.length} 篇文章</span>
          <span>{groupedArticles.length} 个年份分组</span>
        </div>
      </section>

      <section className={styles['timeline']}>
        {groupedArticles.map(([year, articles]) => (
          <section key={year} id={year} className={styles['year-group']}>
            <header className={styles['year-header']}>
              <div>
                <h2>{year}</h2>
                <p>{articles.length} 篇已发布内容</p>
              </div>
              <a href={`#${year}`} className={styles['year-anchor']}>
                回到 {year}
              </a>
            </header>

            <div className={styles['article-list']}>
              {articles.map((article) => (
                <Details article={article} key={article.articleId} showMenu={canManageArticles} />
              ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  );
};

export default MyArticle;
