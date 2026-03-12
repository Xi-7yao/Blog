import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import SidebarLeft from '../SidebarLeft';
import LoginModal from '../Login';
import MobileNav from '../MobileNav';
import { useTheme } from '../../context/useTheme';
import { fetchArticles } from '../../redux/slices/articlesSlice';
import type { AppDispatch } from '../../redux/store';
import styles from './index.module.css';

const Layout = () => {
  const { theme } = useTheme();
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    void dispatch(fetchArticles({}));
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div data-theme={theme} className={styles['layoutContainer']}>
      {showSidebar ? (
        <div className={styles['sidebarLeftContainer']}>
          <SidebarLeft />
        </div>
      ) : null}
      <div className={styles['mainContainer']}>
        <Outlet />
      </div>
      {!showSidebar ? <MobileNav /> : null}
      <LoginModal />
    </div>
  );
};

export default Layout;
