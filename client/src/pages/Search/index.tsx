import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Details from '../../components/Details';
import SearchBox from '../../components/SearchBox';
import { searchArticlesApi } from '../../api/articlesApi';
import { SearchArticleResult } from '../../type/articles';
import styles from './index.module.css';

type SearchStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Search failed. Please try again.';
};

const Search = () => {
  const [searchParams] = useSearchParams();
  const keyword = (searchParams.get('keyword') ?? '').trim();
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<SearchArticleResult[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!keyword) {
      setStatus('idle');
      setResults([]);
      setTotal(0);
      setError('');
      return;
    }

    const controller = new AbortController();

    const runSearch = async () => {
      setStatus('loading');
      setError('');

      try {
        const response = await searchArticlesApi(
          { keyword, page: 1, limit: 20 },
          { signal: controller.signal, retry: 0 }
        );
        setResults(response.results);
        setTotal(response.total);
        setStatus('succeeded');
      } catch (requestError) {
        if (requestError instanceof Error && requestError.message === 'Request canceled by user') {
          return;
        }

        setResults([]);
        setTotal(0);
        setError(getErrorMessage(requestError));
        setStatus('failed');
      }
    };

    void runSearch();

    return () => controller.abort();
  }, [keyword]);

  return (
    <main className={styles['search-container']}>
      <section className={styles['search-hero']}>
        <h1>Search Articles</h1>
        <p>Search by title, tags, category, or content.</p>
        <SearchBox initialValue={keyword} />
      </section>

      {!keyword ? (
        <section className={styles['search-empty']}>
          <h2>Start with a keyword</h2>
          <p>Try a topic, tag, category, or even a pinyin keyword.</p>
        </section>
      ) : null}

      {keyword ? (
        <section className={styles['search-results']}>
          <header className={styles['search-summary']}>
            <h2>Results for "{keyword}"</h2>
            <span>{total} articles</span>
          </header>

          {status === 'loading' ? <div className={styles['search-state']}>Loading search results...</div> : null}
          {status === 'failed' ? <div className={styles['search-state']}>{error}</div> : null}
          {status === 'succeeded' && results.length === 0 ? (
            <div className={styles['search-state']}>No matching articles were found.</div>
          ) : null}

          {results.map((result) => (
            <div key={result.article.articleId} className={styles['result-item']}>
              <Details
                article={result.article}
                showMenu={false}
                descriptionOverride={result.snippet || result.article.description}
              />
            </div>
          ))}
        </section>
      ) : null}
    </main>
  );
};

export default Search;
