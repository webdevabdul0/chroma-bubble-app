
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar open={isMobile ? false : sidebarOpen} setOpen={setSidebarOpen} />
      
      <main className="flex-1 overflow-auto relative transition-all duration-300">
        {isMobile && (
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="fixed top-4 left-4 z-50 p-2 rounded-md bg-secondary text-secondary-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </button>
        )}
        
        {children}
      </main>
    </div>
  );
};
