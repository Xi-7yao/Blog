import styles from './index.module.css';
import profilePicture from '../../assets/avatar_hu897059592634026878.png';
import { useTheme } from '../../context/ThemeContext';
import {
  HomeOutlined,
  ContainerOutlined,
  // SearchOutlined,
  FileTextOutlined,
  LogoutOutlined,
  LoginOutlined,
  ReconciliationOutlined,
} from '@ant-design/icons';
import { Switch, Button, Tooltip } from 'antd';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SidebarLeft = () => {
  const { toggleTheme } = useTheme();
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '');
  const { user, setIsLoginOpen, logout } = useAuth();

  // useEffect(() => {
  //   console.log(user);
  // }, [user]);

  const handleProfileClick = () => {
    if (!user) {
      setIsLoginOpen(true); // 未登录，打开登录模态框
    }
    // 已登录：无操作（可扩展）
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // console.error('退出失败:', error);
    }
  };

  return (
    <div className={styles['sideBar-left']}>
      <div className={styles['userContainer']}>
        <div className={styles['userHead']}>
          <div className={styles['profilePicture']}>
            <div onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
              <img
                src={profilePicture}
                alt=""
                className={styles['profilePicture-logo']}
              />
            </div>
            {user && (
              <Tooltip title="退出账户">
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  className={styles['logout-button']}
                />
              </Tooltip>
            )}
          </div>
          {!user && (
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => setIsLoginOpen(true)}
              className={styles['login-button']}
            >
              登录 / 注册
            </Button>
          )}
        </div>
        <div className={styles['userMeta']}>
          <h1 className={styles['username']}>
            <a href="/">{user ? user.username : '点击上方头像登录 / 注册'}</a>
          </h1>
          <h2 className={styles['userDescription']}>
            {user ? user.description : '暂不支持修改功能'}
          </h2>
        </div>
      </div>
      <div className={styles['menu-social']}></div>
      <div className={styles['menu']}>
        <div className={styles['menu-item']}>
          <a href="/" className={pathname === '' ? styles['menu-item-active'] : ''}>
            <HomeOutlined className={styles['antIcon']} />
            <span>首页</span>
          </a>
        </div>
        <div className={styles['menu-item']}>
          <a href={`/user/${user?.userId}`} className={pathname === `/user/${user?.userId}` ? styles['menu-item-active'] : ''}>
            <ContainerOutlined className={styles['antIcon']} />
            <span>我的文章</span>
          </a>
        </div>
        {/* <div className={styles['menu-item']}>
          <a href="/search" className={pathname === '/search' ? styles['menu-item-active'] : ''}>
            <SearchOutlined className={styles['antIcon']} />
            <span>搜索</span>
          </a>
        </div> */}
        <div className={styles['menu-item']}>
          <a href="/new" className={pathname === '/new' ? styles['menu-item-active'] : ''}>
            <FileTextOutlined className={styles['antIcon']} />
            <span>写文章</span>
          </a>
        </div>
        <div className={styles['menu-item']}>
          <a href={`/user/${user?.userId}/drafts`} className={pathname === '/new' ? styles['menu-item-active'] : ''}>
            <ReconciliationOutlined className={styles['antIcon']} />
            <span>草稿箱</span>
          </a>
        </div>
        <div className={styles['menu-bottom-section']}>
          <div className={styles['menu-item']}>
            <Switch
              className={styles['menu-item-switch']}
              checkedChildren="Light"
              unCheckedChildren="Dark"
              defaultChecked
              onClick={toggleTheme}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarLeft;
