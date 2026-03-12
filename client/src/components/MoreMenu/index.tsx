import { useEffect, useRef, useState } from 'react';
import { EllipsisOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deleteArticle, fetchArticles } from '../../redux/slices/articlesSlice';
import type { AppDispatch } from '../../redux/store';
import styles from './index.module.css';

const MoreMenu = ({ id }: { id: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

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
    navigate(`/edit/${id}`);
    setIsOpen(false);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('确定要删除这篇文章吗？');
    if (!confirmed) {
      return;
    }

    try {
      await dispatch(deleteArticle(id)).unwrap();
      await dispatch(fetchArticles({ page: 1, limit: 10 })).unwrap();
      message.success('文章删除成功');
    } catch {
      message.error('删除失败，请稍后再试');
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <div className={styles['more-menu']} ref={menuRef}>
      <button
        type="button"
        className={styles['more-menu-button']}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open article actions"
      >
        <EllipsisOutlined className={styles['antIcon']} />
      </button>

      {isOpen ? (
        <div className={styles['more-menu-list']}>
          <button type="button" className={styles['more-menu-item']} onClick={handleEdit}>
            编辑
          </button>
          <button type="button" className={styles['more-menu-item']} onClick={handleDelete}>
            删除
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default MoreMenu;
