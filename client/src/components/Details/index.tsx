import styles from './index.module.css';
import { Article } from '../../type/articles';
import MoreMenu from '../MoreMenu';
import { CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const Details = ({
    article,
    showMenu = true,
    toUrl,
    descriptionOverride,
}: {
    article: Article,
    showMenu?: boolean,
    toUrl?: string,
    descriptionOverride?: string,
}) => {
    const url = toUrl? toUrl: `/article/${article.articleId}`;

    return (
        <article className={styles['article-item']}>
            <div className={styles['article-header']}>
                    <div className={styles['article-tag-list']}>
                        { article.meta.tags.map((tag) => (
                            <span key={tag} className={styles['article-tag-item']}>
                                { tag }
                            </span>
                        )) }
                    </div>
                    <div className={styles['article-title']}>
                        <h2>
                            <Link to={url}>{ article.meta.title }</Link>
                        </h2>
                        <h3>
                            { descriptionOverride ?? article.description }
                        </h3>
                    </div>
                    <footer className={styles['article-footer']}>
                        <div className={styles['article-meta-group']}>
                            <div className={styles['article-date']}>
                                <CalendarOutlined className={styles['article-meta-icon']} />
                                <time dateTime={article.meta.createdAt}>
                                    { new Date(article.meta.createdAt || '')
                                        .toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: '2-digit',
                                        year: 'numeric',
                                    })}
                                </time>
                            </div>
                            <div className={styles['article-date']}>
                                <EyeOutlined className={styles['article-meta-icon']} />
                                <span>{article.stats?.views ?? 0}</span>
                            </div>
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
        </article>
    )
};

export default Details;
