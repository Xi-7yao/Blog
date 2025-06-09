import styles from './index.module.css';
// import SearchBox from '../SearchBox';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { setSelectedCategory } from '../../redux/slices/articlesSlice';
import { useNavigate } from 'react-router-dom';

const SidebarRight = () => {
  const categories = useSelector((state: RootState) => state.articles.categories); // string[]
  const selectedCategory = useSelector((state: RootState) => state.articles.selectedCategory);
  const articles = useSelector((state: RootState) => state.articles.articles);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // 计算每个分类的文章数量
  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] =
      category === '综合'
        ? Object.values(articles).length
        : Object.values(articles).filter((article) => article.meta.category === category).length;
    return acc;
  }, {} as { [key: string]: number });

  // 处理分类点击
  const handleCategoryClick = (category: string) => {
    dispatch(setSelectedCategory(category));
    navigate(category === '综合' ? '/' : `/category/${category}`);
  };

  return (
    <div className={styles['sideBar-right']}>
      {/* <SearchBox /> */}
      <section className={styles['categoryContainer']}>
        <span className={styles['categoryIcon']}>∞</span>
        <h2 className={styles['categoryTitle']}>分类</h2>
        <div className={styles['categoryList']}>
          {categories.map((category) => (
            <div
              key={category}
              className={`${styles['categoryItem']}`}
            >
              <a
                href={category === '综合' ? '/' : `/category/${category}`}
                className={`${selectedCategory === category? styles['categoryItem-link-active'] : styles['categoryItem-link']}`}
                onClick={(e) => {
                  e.preventDefault(); // 阻止默认跳转
                  handleCategoryClick(category);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategoryClick(category);
                  }
                }}
                tabIndex={0}
                aria-current={selectedCategory === category ? 'true' : undefined}
              >
                <span className={styles['category']}>{category}</span>
                <span className={styles['count']}>{categoryCounts[category]}</span>
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SidebarRight;
