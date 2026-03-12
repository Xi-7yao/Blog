import { Link } from 'react-router-dom';
import styles from './index.module.css';

const NotFound = () => {
  return (
    <main className={styles['not-found-page']}>
      <section className={styles['not-found-panel']}>
        <span className={styles['eyebrow']}>404</span>
        <h1>这个页面不存在</h1>
        <p>你访问的地址可能已经变更，或者这个内容还没有发布。</p>
        <Link to="/" className={styles['back-home']}>
          返回首页
        </Link>
      </section>
    </main>
  );
};

export default NotFound;
