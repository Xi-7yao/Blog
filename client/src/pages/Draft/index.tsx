import { Pagination } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Details from '../../components/Details';
import { useAuth } from '../../context/useAuth';
import { fetchMyArticles } from '../../redux/slices/articlesSlice';
import type { AppDispatch, RootState } from '../../redux/store';
import styles from './index.module.css';

const PAGE_SIZE = 10;

const Draft = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [currentPage, setCurrentPage] = useState(1);
  const myArticles = useSelector((state: RootState) => state.articles.myArticles);
  const draftsTotal = useSelector((state: RootState) => state.articles.myArticlesTotal);

  useEffect(() => {
    setCurrentPage(1);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      void dispatch(
        fetchMyArticles({
          userId,
          page: currentPage,
          limit: PAGE_SIZE,
          published: 'false',
        })
      );
    }
  }, [currentPage, dispatch, userId]);

  const draftArticles = useMemo(
    () =>
      Object.values(myArticles).sort(
        (left, right) =>
          new Date(right.meta.updatedAt ?? '').getTime() - new Date(left.meta.updatedAt ?? '').getTime()
      ),
    [myArticles]
  );

  return (
    <div className={styles['draft-container']}>
      <div className={styles['draft-main']}>
        <Link to={`/user/${userId}/drafts`} className={styles['draft-header']}>
          <span className={styles['draft-text']}>草稿箱</span>
          <span className={styles['draft-count']}>{draftsTotal} 篇草稿</span>
        </Link>

        {draftArticles.length > 0 ? (
          draftArticles.map((article) => (
            <Details
              article={article}
              toUrl={`/edit/${article.articleId}`}
              showMenu={userId === user?.userId || user?.role === 'admin'}
              key={article.articleId}
            />
          ))
        ) : (
          <div className={styles['draft-empty']}>
            <h2>还没有草稿内容</h2>
            <p>开始写作后，自动保存的内容会出现在这里，方便继续编辑和整理。</p>
          </div>
        )}

        {draftsTotal > PAGE_SIZE ? (
          <div className={styles['paginationContainer']}>
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={draftsTotal}
              showSizeChanger={false}
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Draft;
