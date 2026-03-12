import styles from './index.module.css';
import profilePicture from '../../assets/avatar_hu897059592634026878.png';
import { useTheme } from '../../context/useTheme';
import {
  HomeOutlined,
  ContainerOutlined,
  FileTextOutlined,
  LogoutOutlined,
  LoginOutlined,
  ReconciliationOutlined,
  BulbOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

const SidebarLeft = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { user, setIsLoginOpen, logout } = useAuth();

  const handleProfileClick = () => {
    if (!user) {
      setIsLoginOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch {
      // Error feedback is handled in the API layer.
    }
  };

  return (
    <aside className={styles['sideBar-left']}>
      <section className={styles['userContainer']}>
        <div className={styles['userHead']}>
          <div className={styles['profilePicture']}>
            <div onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
              <img src={profilePicture} alt="User avatar" className={styles['profilePicture-logo']} />
            </div>
            {user ? (
              <Tooltip title="退出登录">
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  className={styles['logout-button']}
                />
              </Tooltip>
            ) : null}
          </div>
          {!user ? (
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => setIsLoginOpen(true)}
              className={styles['login-button']}
            >
              登录 / 注册
            </Button>
          ) : null}
        </div>

        <div className={styles['userMeta']}>
          <span className={styles['userEyebrow']}>{user ? '当前账号' : '欢迎来到博客空间'}</span>
          <h1 className={styles['userName']}>
            <Link to="/">{user ? user.username : '点击头像登录 / 注册'}</Link>
          </h1>
          <p className={styles['userDescription']}>
            {user ? user.description : '登录后可以管理文章、草稿与发布内容'}
          </p>
        </div>
      </section>

      <nav className={styles['menu']}>
        <div className={styles['menu-item']}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? styles['menu-item-active'] : '')}>
            <HomeOutlined className={styles['antIcon']} />
            <span>首页</span>
          </NavLink>
        </div>

        <div className={styles['menu-item']}>
          {user ? (
            <NavLink
              to={`/user/${user.userId}`}
              end
              className={({ isActive }) => (isActive ? styles['menu-item-active'] : '')}
            >
              <ContainerOutlined className={styles['antIcon']} />
              <span>我的文章</span>
            </NavLink>
          ) : (
            <button type="button" className={styles['menu-item-button']} onClick={() => setIsLoginOpen(true)}>
              <ContainerOutlined className={styles['antIcon']} />
              <span>我的文章</span>
            </button>
          )}
        </div>

        <div className={styles['menu-item']}>
          <NavLink to="/new" className={({ isActive }) => (isActive ? styles['menu-item-active'] : '')}>
            <FileTextOutlined className={styles['antIcon']} />
            <span>写文章</span>
          </NavLink>
        </div>

        <div className={styles['menu-item']}>
          {user ? (
            <NavLink
              to={`/user/${user.userId}/drafts`}
              className={({ isActive }) => (isActive ? styles['menu-item-active'] : '')}
            >
              <ReconciliationOutlined className={styles['antIcon']} />
              <span>草稿箱</span>
            </NavLink>
          ) : (
            <button type="button" className={styles['menu-item-button']} onClick={() => setIsLoginOpen(true)}>
              <ReconciliationOutlined className={styles['antIcon']} />
              <span>草稿箱</span>
            </button>
          )}
        </div>

        <div className={styles['menu-bottom-section']}>
          <button type="button" className={styles['themeToggle']} onClick={toggleTheme}>
            <span className={styles['themeToggleIcon']}>
              {theme === 'light' ? <MoonOutlined /> : <BulbOutlined />}
            </span>
            <span className={styles['themeToggleLabel']}>
              {theme === 'light' ? '切换到深色' : '切换到浅色'}
            </span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default SidebarLeft;
