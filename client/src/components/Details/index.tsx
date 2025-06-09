import styles from './index.module.css';
import { Article } from '../../type/articles';
import MoreMenu from '../MoreMenu';
import { CalendarOutlined } from '@ant-design/icons';

const Details = ({article, showMenu = true, toUrl}: {article: Article, showMenu?: boolean, toUrl?: string}) => {
    const url = toUrl? toUrl: `/article/${article.articleId}`;

    return (
        <article className={styles['article-item']}>
            <header>
                <div className={styles['article-header']}>
                    <header className={styles['article-tag-list']}>
                        { article.meta.tags.map((tag) => (
                            <a key={tag} 
                                href='/' 
                                className={styles['article-tag-item']} 
                            >
                                { tag }
                            </a>
                        )) }
                    </header>
                    <div className={styles['article-title']}>
                        <h2>
                            <a href={url}>{ article.meta.title }</a>
                        </h2>
                        <h3>
                            { article.description }
                        </h3>
                    </div>
                    <footer className={styles['article-footer']}>
                        <div className={styles['article-date']}>
                            <CalendarOutlined 
                                style={{fontSize: '16px'}}
                            />
                            <time dateTime={article.meta.createdAt}>
                                { new Date(article.meta.createdAt || '')
                                    .toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: '2-digit',
                                    year: 'numeric',
                                })}
                            </time>
                        </div>
                        { showMenu && (
                            <div className={styles['article-more']}>
                                <MoreMenu id={article.articleId} />
                            </div>
                        )}
                        <div className={styles['category-icon']}>
                            {article.meta.category}
                        </div>
                    </footer>
                </div>
            </header>
        </article>
    )
};

export default Details;
