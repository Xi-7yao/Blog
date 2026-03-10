import styles from './index.module.css';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { setSelectedCategory } from '../../redux/slices/articlesSlice';
import { useNavigate } from 'react-router-dom';
import { AppstoreOutlined } from '@ant-design/icons';

const SidebarRight = () => {
  const categories = useSelector((state: RootState) => state.articles.categories);
  const selectedCategory = useSelector((state: RootState) => state.articles.selectedCategory);
  const articles = useSelector((state: RootState) => state.articles.articles);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const publishedArticles = Object.values(articles).filter((article) => article.published);

  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] =
      category === '综合'
        ? publishedArticles.length
        : publishedArticles.filter((article) => article.meta.category === category).length;
    return acc;
  }, {} as Record<string, number>);

  const handleCategoryClick = (category: string) => {
    dispatch(setSelectedCategory(category));
    navigate(category === '综合' ? '/' : `/category/${category}`);
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
                <span className={styles['countBadge']}>{categoryCounts[category]}</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};

export default SidebarRight;
