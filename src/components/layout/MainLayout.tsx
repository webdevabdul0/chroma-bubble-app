import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createChat } from '@/lib/firebaseChat';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);
  
  // Handler to select a chat
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };
  
  // Handler to create a new chat
  const handleNewChat = async () => {
    if (!user) return;
    const defaultTitle = 'New Chat';
    const defaultSystem = 'You are a helpful assistant.';
    const chatId = await createChat(defaultTitle, defaultSystem, user.uid);
    setSelectedChatId(chatId);
    // Optionally, you can navigate to /chat?chatId=chatId if needed
    window.location.href = `/chat?chatId=${chatId}`;
  };
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - hidden on mobile by default */}
      <Sidebar 
        open={isMobile ? mobileMenuOpen : sidebarOpen} 
        setOpen={isMobile ? setMobileMenuOpen : setSidebarOpen} 
        isMobile={isMobile}
        selectedChatId={selectedChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />
      
      <main 
        className={`flex-1 overflow-auto relative transition-all duration-300 ease-in-out ${
          sidebarOpen && !isMobile ? 'ml-64' : isMobile ? 'ml-0' : 'ml-20'
        }`}
      >
        {/* Mobile menu button */}
        {isMobile && (
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="fixed top-4 left-4 z-40 p-2 rounded-md bg-secondary text-secondary-foreground"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        )}
        
        {/* Overlay to close mobile menu when clicking outside */}
        {isMobile && mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        
        {children}
      </main>
    </div>
  );
};
