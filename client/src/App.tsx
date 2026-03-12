import { Suspense, lazy } from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import store from './redux/store';

const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const MyArticle = lazy(() => import('./pages/MyArticle'));
const New = lazy(() => import('./pages/New'));
const Article = lazy(() => import('./pages/Article'));
const Draft = lazy(() => import('./pages/Draft'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Provider store={store}>
          <Router>
            <Suspense fallback={<div style={{ padding: '32px', textAlign: 'center' }}>Loading page...</div>}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/user/:userId" element={<MyArticle />} />
                  <Route path="/article/:articleId" element={<Article />} />
                  <Route path="/category/:category" element={<Home />} />
                  <Route path="/user/:userId/drafts" element={<Draft />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/new" element={<New />} />
                <Route path="/edit/:articleId" element={<New />} />
              </Routes>
            </Suspense>
          </Router>
        </Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
