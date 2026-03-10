import { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import { Provider } from 'react-redux';
import store from './redux/store';
import { AuthProvider } from './context/AuthContext';
const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const MyArticle = lazy(() => import('./pages/MyArticle'));
const New = lazy(() => import('./pages/New'));
const Article = lazy(() => import('./pages/Article'));
const TestApi = lazy(() => import('./pages/TestApi'));
const Draft = lazy(() => import('./pages/Draft'));

function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
        <Provider store={store}>
          <Router>
            <Suspense fallback={<div style={{ padding: '32px', textAlign: 'center' }}>Loading page...</div>}>
              <Routes>
                <Route path='/' element={<Layout/>}>
                  <Route index element={<Home/>}/>
                  <Route path='/search' element={<Search/>}/>
                  <Route path='/user/:userId' element={<MyArticle/>}/>
                  <Route path='/article/:articleId' element={<Article/>}/>
                  <Route path='/category/:category' element={<Home/>}/>
                  <Route path='/user/:userId/drafts' element={<Draft/>}/>
                </Route>
                <Route path='/new' element={<New/>}/>
                <Route path="/edit/:articleId" element={<New />} />
                <Route path='/test' element={<TestApi/>}/>
              </Routes>
            </Suspense>
          </Router>
        </Provider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
