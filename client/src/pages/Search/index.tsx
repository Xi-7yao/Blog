import SearchBox from '../../components/SearchBox';
import styles from './index.module.css';

const Search = () => {
    return (
        <main className={styles['search-container']}>
            <SearchBox />
        </main>
    )
}

export default Search;
