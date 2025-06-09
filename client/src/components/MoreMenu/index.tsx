import { useEffect, useRef, useState } from 'react';
    import styles from './index.module.css';
    import { EllipsisOutlined } from '@ant-design/icons';
    import { message } from 'antd';
    import { useDispatch } from 'react-redux';
    import { AppDispatch } from '../../redux/store';
    import { deleteArticle, fetchArticles } from '../../redux/slices/articlesSlice';

    const MoreMenu = ({ id }: { id: string }) => {
        const [isOpen, setIsOpen] = useState(false);
        const menuRef = useRef<HTMLDivElement>(null);
        const dispatch = useDispatch<AppDispatch>();

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);

            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const handleEdit = () => {
            window.location.href = `/edit/${id}`;
            setIsOpen(false);
        };

        const handleDelete = async () => {
            const confirm = window.confirm('确定要删除吗？');
            if (!confirm) return;
      
            try {
            await dispatch(deleteArticle(id)).unwrap(); // 使用 deleteArticle
            await dispatch(fetchArticles({ page: 1, limit: 10 })).unwrap(); // 确保获取最新数据
            message.success('文章删除成功');
            } catch (error) {
            // console.error('Delete error:', error);
            message.error('删除失败');
            }
        
            setIsOpen(false);
        };

        return (
            <div className={styles['more-menu']} ref={menuRef}>
                <button className={styles['more-menu-button']} onClick={() => setIsOpen(!isOpen)}>
                    <EllipsisOutlined className={styles['antIcon']} />
                </button>
                {isOpen && (
                    <div className={styles['more-menu-list']}>
                        <button className={styles['more-menu-item']} onClick={handleEdit}>
                            编辑
                        </button>
                        <button className={styles['more-menu-item']} onClick={handleDelete}>
                            删除
                        </button>
                    </div>
                )}
            </div>
        );
    };

  export default MoreMenu;