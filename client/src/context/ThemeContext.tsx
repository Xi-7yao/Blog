import React, { useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeContext } from './theme-context';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 尝试从localStorage获取主题设置
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });

  // 当主题改变时，保存到localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
    // 可选：在这里可以设置文档的data-theme属性
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
