import { useEffect, useMemo, useState } from 'react';
import { AppstoreOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getCategoryStatsApi } from '../../api/articlesApi';
import { CATEGORY_ALL, setSelectedCategory } from '../../redux/slices/articlesSlice';
import type { AppDispatch, RootState } from '../../redux/store';
import styles from './index.module.css';

const SidebarRight = () => {
  const categories = useSelector((state: RootState) => state.articles.categories);
  const selectedCategory = useSelector((state: RootState) => state.articles.selectedCategory);
  const articles = useSelector((state: RootState) => state.articles.articles);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [remoteCounts, setRemoteCounts] = useState<Record<string, number> | null>(null);

  const localCounts = useMemo(() => {
    const publishedArticles = Object.values(articles).filter((article) => article.published);

    return categories.reduce<Record<string, number>>((acc, category) => {
      acc[category] =
        category === CATEGORY_ALL
          ? publishedArticles.length
          : publishedArticles.filter((article) => article.meta.category === category).length;
      return acc;
    }, {});
  }, [articles, categories]);

  useEffect(() => {
    let active = true;

    void getCategoryStatsApi({ retry: 0 })
      .then((response) => {
        if (!active) {
          return;
        }

        setRemoteCounts({
          ...response.counts,
          [CATEGORY_ALL]: response.total,
        });
      })
      .catch(() => {
        if (active) {
          setRemoteCounts(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const categoryCounts = remoteCounts ?? localCounts;

  const handleCategoryClick = (category: string) => {
    dispatch(setSelectedCategory(category));
    navigate(category === CATEGORY_ALL ? '/' : `/category/${category}`);
  };

  return (
    <aside className={styles['sideBar-right']}>
      <section className={styles['categoryContainer']}>
        <div className={styles['categoryHeader']}>
          <span className={styles['categoryIcon']}>
            <AppstoreOutlined />
          </span>
          <div>
            <h2 className={styles['categoryTitle']}>分类</h2>
            <p className={styles['categorySubtitle']}>按主题快速浏览内容</p>
          </div>
        </div>

        <div className={styles['categoryList']}>
          {categories.map((category) => (
            <div key={category} className={styles['categoryItem']}>
              <button
                type="button"
                className={
                  selectedCategory === category
                    ? styles['categoryItem-link-active']
                    : styles['categoryItem-link']
                }
                onClick={() => handleCategoryClick(category)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleCategoryClick(category);
                  }
                }}
                aria-current={selectedCategory === category ? 'true' : undefined}
              >
                <span className={styles['categoryName']}>{category}</span>
                <span className={styles['countBadge']}>{categoryCounts[category] ?? 0}</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};

export default SidebarRight;
