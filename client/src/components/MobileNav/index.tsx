import {
  ContainerOutlined,
  EditOutlined,
  FileTextOutlined,
  HomeOutlined,
  LoginOutlined,
  MoonOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../context/useTheme';
import styles from './index.module.css';

const MobileNav = () => {
  const navigate = useNavigate();
  const { user, setIsLoginOpen } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const requireLogin = (to: string) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }

    navigate(to);
  };

  return (
    <nav className={styles['mobile-nav']} aria-label="Mobile navigation">
      <NavLink to="/" end className={({ isActive }) => (isActive ? styles['nav-link-active'] : styles['nav-link'])}>
        <HomeOutlined />
        <span>首页</span>
      </NavLink>

      <button
        type="button"
        className={styles['nav-link']}
        onClick={() => requireLogin(`/user/${user?.userId ?? ''}`)}
      >
        <ContainerOutlined />
        <span>文章</span>
      </button>

      <NavLink to="/new" className={({ isActive }) => (isActive ? styles['nav-link-active'] : styles['nav-link'])}>
        <EditOutlined />
        <span>写作</span>
      </NavLink>

      <button
        type="button"
        className={styles['nav-link']}
        onClick={() => requireLogin(`/user/${user?.userId ?? ''}/drafts`)}
      >
        <FileTextOutlined />
        <span>草稿</span>
      </button>

      {user ? (
        <button type="button" className={styles['nav-link']} onClick={toggleTheme}>
          {theme === 'light' ? <MoonOutlined /> : <BulbOutlined />}
          <span>{theme === 'light' ? '深色' : '浅色'}</span>
        </button>
      ) : (
        <button type="button" className={styles['nav-link']} onClick={() => setIsLoginOpen(true)}>
          <LoginOutlined />
          <span>登录</span>
        </button>
      )}
    </nav>
  );
};

export default MobileNav;
