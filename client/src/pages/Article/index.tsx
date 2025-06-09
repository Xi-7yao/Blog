import styles from './index.module.css';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchArticlesById } from '../../redux/slices/articlesSlice';
import Details from '../../components/Details';
import { Viewer } from '@bytemd/react';
import { BytemdPlugin } from 'bytemd';
import gfm from '@bytemd/plugin-gfm';

const Article = () => {
    const { articleId } = useParams();
    const dispatch = useDispatch<AppDispatch>();
    const article = useSelector((state: RootState) => state.articles.currentArticle);
    const plugins: BytemdPlugin[] = [gfm()];

    useEffect(() => {
        if (articleId) {
            dispatch(fetchArticlesById(articleId));
        }
    }, [dispatch, articleId]);

    return (
        <main className={styles['article-container']}>
            <header>
                { article && <Details article={article} showMenu={false} /> }
            </header>
            <div className={styles['article-content']}>
                {article?.content ? (
                    <div className="markdown-body">
                        <Viewer value={article.content} 
                            plugins={plugins}
                        />
                    </div>  
                ) : (
                    <p>暂无内容</p>
                )}
            </div>
            <footer></footer>
        </main>
    );
}

export default Article;