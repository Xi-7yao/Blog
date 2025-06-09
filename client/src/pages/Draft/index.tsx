import styles from './index.module.css';
import Details from '../../components/Details';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { Article } from '../../type/articles';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchMyArticles } from '../../redux/slices/articlesSlice';

const Draft = () => {
    const { userId } = useParams();
    const { user } = useAuth();
    const [articles, setArticles] = useState<Article[]>([]);
    const dispatch = useDispatch<AppDispatch>();
    // const myArticles = useSelector((state: RootState) => state.articles.myArticles);
    const myArticles = useSelector((state: RootState) =>
        user?.role === 'admin' ? state.articles.articles : state.articles.myArticles
    );

    useEffect(() => {
        console.log(myArticles)
    }, [myArticles])

    // 获取个人文章（仅在登录时）
    useEffect(() => {
        if (userId) {
            dispatch(fetchMyArticles(userId));
        }
    }, [userId, dispatch]);

    useEffect(() => {
        const myArticlesArray = Object.values(myArticles).filter((article) => article.published === false); 
        setArticles(myArticlesArray);
    }, [myArticles])

    return (
        <div className={styles['draft-container']}>
            <div className={styles['draft-main']}>
                <a href="/draft" className={styles['draft-header']}>
                    <span className={styles['draft-text']}>草稿箱</span>
                </a>
                {articles.map((article) => (
                    <Details 
                        article={article} 
                        toUrl={`/edit/${article.articleId}`} 
                        showMenu={userId === user?.userId} 
                        key={article.articleId}
                    />    
                ))}
            </div>
        </div>
    )
}

export default Draft;