
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeType = 'blue' | 'purple' | 'green' | 'pink' | 'orange';

interface ThemeContextType {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    // Try to get the theme from localStorage
    const savedTheme = localStorage.getItem('chatAppTheme');
    return (savedTheme as ThemeType) || 'blue';
  });

  useEffect(() => {
    // Save theme to localStorage whenever it changes
    localStorage.setItem('chatAppTheme', currentTheme);
    
    // Remove all theme classes first
    document.documentElement.classList.remove(
      'theme-blue', 
      'theme-purple', 
      'theme-green', 
      'theme-pink', 
      'theme-orange'
    );
    
    // Add the current theme class
    if (currentTheme !== 'blue') {
      document.documentElement.classList.add(`theme-${currentTheme}`);
    }
  }, [currentTheme]);

  const setTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
