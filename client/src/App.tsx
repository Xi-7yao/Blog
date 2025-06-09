import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Search from './pages/Search';
import { Provider } from 'react-redux';
import store from './redux/store';
import MyArticle from './pages/MyArticle';
import New from './pages/New';
import Article from './pages/Article';
import { AuthProvider } from './context/AuthContext';
import TestApi from './pages/TestApi';
import Draft from './pages/Draft';

function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
        <Provider store={store}>
          <Router>
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
          </Router>
        </Provider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
