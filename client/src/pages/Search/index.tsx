import { Pagination } from 'antd';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Details from '../../components/Details';
import SearchBox from '../../components/SearchBox';
import { searchArticlesApi } from '../../api/articlesApi';
import { SearchArticleResult } from '../../type/articles';
import styles from './index.module.css';

type SearchStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

const PAGE_SIZE = 10;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return '搜索失败，请稍后再试。';
};

const Search = () => {
  const [searchParams] = useSearchParams();
  const keyword = (searchParams.get('keyword') ?? '').trim();
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<SearchArticleResult[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

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
          { keyword, page: currentPage, limit: PAGE_SIZE },
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
  }, [currentPage, keyword]);

  return (
    <main className={styles['search-container']}>
      <section className={styles['search-hero']}>
        <h1>搜索文章</h1>
        <p>支持标题、标签、分类、正文片段和拼音关键词检索。</p>
        <SearchBox initialValue={keyword} />
      </section>

      {!keyword ? (
        <section className={styles['search-empty']}>
          <h2>输入一个关键词开始搜索</h2>
          <p>可以试试主题、标签、分类，或者拼音关键词。</p>
        </section>
      ) : null}

      {keyword ? (
        <section className={styles['search-results']}>
          <header className={styles['search-summary']}>
            <h2>“{keyword}” 的搜索结果</h2>
            <span>{total} 篇匹配文章</span>
          </header>

          {status === 'loading' ? <div className={styles['search-state']}>正在加载搜索结果...</div> : null}
          {status === 'failed' ? <div className={styles['search-state']}>{error}</div> : null}
          {status === 'succeeded' && results.length === 0 ? (
            <div className={styles['search-state']}>没有找到匹配的文章。</div>
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

          {total > PAGE_SIZE ? (
            <div className={styles['paginationContainer']}>
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={total}
                showSizeChanger={false}
                onChange={(page) => setCurrentPage(page)}
              />
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
};

export default Search;
