import { Pagination } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Details from '../../components/Details';
import SidebarRight from '../../components/SidebarRight';
import { CATEGORY_ALL, fetchArticles, setSelectedCategory } from '../../redux/slices/articlesSlice';
import type { AppDispatch, RootState } from '../../redux/store';
import styles from './index.module.css';

const PAGE_SIZE = 10;

const Home = () => {
  const articles = useSelector((state: RootState) => state.articles.articles);
  const articlesTotal = useSelector((state: RootState) => state.articles.articlesTotal);
  const categories = useSelector((state: RootState) => state.articles.categories);
  const selectedCategory = useSelector((state: RootState) => state.articles.selectedCategory);
  const status = useSelector((state: RootState) => state.articles.status);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
  const [currentPage, setCurrentPage] = useState(1);
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (category && categories.includes(category) && category !== selectedCategory) {
      dispatch(setSelectedCategory(category));
      return;
    }

    if (!category && selectedCategory !== CATEGORY_ALL) {
      dispatch(setSelectedCategory(CATEGORY_ALL));
      return;
    }

    if (category && !categories.includes(category)) {
      dispatch(setSelectedCategory(CATEGORY_ALL));
      navigate('/');
    }
  }, [category, categories, selectedCategory, dispatch, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    void dispatch(
      fetchArticles({
        page: currentPage,
        limit: PAGE_SIZE,
        category: selectedCategory === CATEGORY_ALL ? undefined : selectedCategory,
      })
    );
  }, [currentPage, dispatch, selectedCategory]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const articlesArray = useMemo(
    () =>
      Object.values(articles).sort(
        (a, b) =>
          new Date(b.meta.updatedAt || '').getTime() - new Date(a.meta.updatedAt || '').getTime()
      ),
    [articles]
  );

  if (status === 'loading' && articlesArray.length === 0) {
    return <div className={styles['noArticles']}>加载中...</div>;
  }

  return (
    <div className={styles['homeContainer']}>
      <main className={styles['mainContainer']}>
        <section className={styles['articleList']}>
          {articlesArray.length > 0 ? (
            articlesArray.map((article) => <Details key={article.articleId} article={article} showMenu={false} />)
          ) : (
            <div className={styles['noArticles']}>当前分类下还没有文章。</div>
          )}
        </section>

        {articlesTotal > PAGE_SIZE ? (
          <div className={styles['paginationContainer']}>
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={articlesTotal}
              showSizeChanger={false}
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        ) : null}
      </main>

      {isDesktop ? (
        <div className={styles['sidebarRightContainer']}>
          <SidebarRight />
        </div>
      ) : null}
    </div>
  );
};

export default Home;
