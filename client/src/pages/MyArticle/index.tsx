import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import styles from './index.module.css';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchMyArticles } from '../../redux/slices/articlesSlice';
import { Article } from '../../type/articles';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../../components/Login';
import Details from '../../components/Details';

const Archives = () => {
  const { userId } = useParams();
  const { user, setIsLoginOpen } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const [yearList, setYearList] = useState<{ [key: string]: Article[] }>({});

  // 根据用户角色选择文章数据
  const myArticles = useSelector((state: RootState) =>
    user?.role === 'admin' ? state.articles.articles : state.articles.myArticles
  );
  const status = useSelector((state: RootState) => state.articles.status);

  useEffect(() => {
    console.log(user);
    console.log(user?.role)
  }, [user])

  // 滚动到 hash 对应的年份
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.hash, myArticles]);

  // 获取个人文章（仅在登录时）
  useEffect(() => {
    if (userId) {
      dispatch(fetchMyArticles(userId));
    }
  }, [userId, dispatch]);

  // 按年份分组文章
  useEffect(() => {
    const myArticlesArray = Object.values(myArticles).filter(
      (article) => article.published === true
    );
    const yearList: { [key: string]: Article[] } = {};
    myArticlesArray.forEach((article) => {
      const year = article.meta.updatedAt?.split('-')[0];
      if (year) {
        yearList[year] = yearList[year] || [];
        yearList[year].push(article);
      }
    });
    setYearList(yearList);
  }, [myArticles]);

  const yearListArray = Object.keys(yearList).sort((a, b) => parseInt(b) - parseInt(a));

  // 未登录
  if (!user) {
    return (
      <main className={styles['archives-container']}>
        <div className={styles['no-auth']}>
          <h2 className={styles['no-auth-title']}>欢迎体验个人文章归档</h2>
          <p className={styles['no-auth-description']}>
            登录后，您可以查看和管理自己的技术文章，记录成长历程。
          </p>
          <button className={styles['login-button']} onClick={() => setIsLoginOpen(true)}>
            立即登录
          </button>
        </div>
        <LoginModal/>
      </main>
    );
  }

  // 加载中
  if (status === 'loading') {
    return <div className={styles['loading']}>加载中...</div>;
  }

  // 已登录但无文章
  if (yearListArray.length === 0) {
    return (
      <main className={styles['archives-container']}>
        <div className={styles['no-articles']}>
          <h2 className={styles['no-articles-title']}>这里什么都没有</h2>
          <p className={styles['no-articles-description']}>
            快来创建您的第一篇文章吧！
          </p>
          <button
            className={styles['create-article-button']}
            onClick={() => navigate('/new')}
          >
            创建文章
          </button>
        </div>
      </main>
    );
  }

  // 已登录且有文章
  return (
    <main className={styles['archives-container']}>
      {yearListArray.map((year) => (
        <div key={year} id={year} className={styles['archives-article-group']}>
          <h2>
            <a href={`#${year}`}>{year}</a>
          </h2>
          <div className={styles['article-list']}>
            {yearList[year].map((article) => (
              <Details article={article} key={article.articleId} showMenu={userId === user.userId || user.role === 'admin'}/>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
};

export default Archives;
