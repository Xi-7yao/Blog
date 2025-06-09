import { Outlet } from "react-router-dom"
import styles from './index.module.css'
import { useTheme } from "../../context/ThemeContext";
import SidebarLeft from "../SidebarLeft";
import { useEffect, useState } from "react";
import { fetchArticles } from "../../redux/slices/articlesSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../redux/store";
import LoginModal from '../Login';

const Layout = () => {  
    const { theme } = useTheme();
    const [isMobile, setIsMobile] = useState(window.innerWidth > 768);
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        dispatch(fetchArticles({}));
    }, [dispatch]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth > 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div data-theme={theme} className={styles['layoutContainer']}>
            {isMobile ? (
                <div className={styles['sidebarLeftContainer']}>
                    <SidebarLeft />
                </div>
            ) : null}
            <div className={styles['mainContainer']}>
                <Outlet />
            </div>
            <LoginModal/>
        </div>
    )
}

export default Layout
