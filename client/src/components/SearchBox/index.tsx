import { SearchOutlined } from '@ant-design/icons';
import styles from './index.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBox = () => {
    const [searchValue, setSearchValue] = useState('');
    const navigate = useNavigate();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    };
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchValue.trim()) {
            // 导航到搜索结果页面，带上查询参数
            navigate(`/search?keyword=${encodeURIComponent(searchValue.trim())}`);
        }
    };

    return (
        <form className={styles['inputContainer']} onSubmit={handleSearchSubmit}>
            <label htmlFor="searchInput" className={styles['searchLabel']}>Search</label>
            <input 
                type="text" 
                className={styles['searchInput']} 
                placeholder="Type something..." 
                value={searchValue}
                onChange={handleSearchChange}
            />
            <button type="submit" className={styles['searchButton']}>
                <SearchOutlined className={styles['searchIcon']} />
            </button>
        </form>
    )
}

export default SearchBox;
