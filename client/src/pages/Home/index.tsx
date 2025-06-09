import SidebarRight from '../../components/SidebarRight';
import styles from './index.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { useEffect, useMemo, useState } from 'react';
import Details from '../../components/Details';
import { useNavigate, useParams } from 'react-router-dom';
import { setSelectedCategory } from '../../redux/slices/articlesSlice';

const Home = () => {
  const articles = useSelector((state: RootState) => state.articles.articles);
  const categories = useSelector((state: RootState) => state.articles.categories);
  const selectedCategory = useSelector((state: RootState) => state.articles.selectedCategory);
  const status = useSelector((state: RootState) => state.articles.status);
  const [isMobile, setIsMobile] = useState(window.innerWidth > 1024);
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // useEffect(()=>{
  //   const 
  // },[])

  useEffect(() => {
    if (category && categories.includes(category) && category !== selectedCategory) {
      dispatch(setSelectedCategory(category));
    } else if (!category && selectedCategory !== '综合') {
      dispatch(setSelectedCategory('综合'));
    } else if (category && !categories.includes(category)) {
      dispatch(setSelectedCategory('综合'));
      navigate('/');
    }
  }, [category, categories, selectedCategory, dispatch, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth > 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const articlesArray = Object.values(articles).filter((article) => article.published === true).sort((a, b) => parseInt(b.meta.updatedAt as string) - parseInt(a.meta.updatedAt as string));

  // useEffect(() => {
  //   console.log(articlesArray);
  // }, [articlesArray]);

  const filteredArticles = useMemo(
    () =>
      selectedCategory === '综合'
        ? articlesArray
        : articlesArray.filter((article) => article.meta?.category === selectedCategory),
    [articlesArray, selectedCategory]
  );

  if (status === 'loading') {
    return <div className={styles['loading']}>加载中...</div>;
  }

  return (
    <div className={styles['homeContainer']}>
      <main className={styles['mainContainer']}>
        <section className={styles['articleList']}>
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <Details key={article.articleId} article={article} showMenu={false}/>
            ))
          ) : (
            <div className={styles['noArticles']}>暂无 {selectedCategory} 类别的文章</div>
          )}
        </section>
      </main>
      {isMobile ? (
        <div className={styles['sidebarRightContainer']}>
          <SidebarRight />
        </div>
      ) : null}
    </div>
  );
};

export default Home;