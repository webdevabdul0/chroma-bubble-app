import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getChats, Chat, deleteChat } from '@/lib/firebaseChat';
import { useAuth } from '@/contexts/AuthContext';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trash } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, setOpen, isMobile, selectedChatId, onSelectChat, onNewChat }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // Function to fetch chats
  const fetchChats = async () => {
    if (!user) return;
    setLoadingChats(true);
    try {
      const chatList = await getChats(user.uid);
      setChats(chatList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoadingChats(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    fetchChats();
  }, [user, loading]);

  // Set up real-time updates for chat titles
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(collection(db, 'chats'), (snapshot) => {
      const updatedChats = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Chat))
        .filter(chat => chat.userId === user.uid)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setChats(updatedChats);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border",
        "transform transition-all duration-300 ease-in-out",
        // Different width based on state
        open ? "w-64" : "w-20",
        // Different translation for mobile vs desktop
        isMobile ? (open ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
        // Hide on mobile when closed
        isMobile && !open && "invisible opacity-0"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo and New Chat */}
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <img src="/bubble-icon.svg" alt="Chroma Bubble" className="w-8 h-8" />
            </div>
            {open && <span className="font-bold text-lg text-gradient-primary">Chroma Bubble</span>}
          </div>
          {/* Only show toggle for desktop */}
          {!isMobile && (
            <button 
              onClick={() => setOpen(!open)} 
              className="focus:outline-none"
              aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "" : "rotate-180"}`}>
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
          )}
        </div>
        {/* New Chat Button */}
        <div className="px-2 pb-2">
          <button
            className="w-full flex items-center justify-center bg-primary text-primary-foreground rounded-md py-2 font-semibold hover:bg-primary/90 transition mb-2"
            onClick={() => { if (user) onNewChat(); else navigate('/login'); }}
            disabled={!user}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {open && 'New Chat'}
          </button>
        </div>
        {/* Chat Sessions */}
        <nav className="px-2 flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="text-center text-muted-foreground py-4">Loading...</div>
          ) : chats.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">No chats yet</div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                className={cn(
                  "flex items-center space-x-2 px-4 py-3 rounded-md cursor-pointer transition-all",
                  chat.id === selectedChatId
                    ? "bg-primary/30 text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  !open && "justify-center"
                )}
                onClick={() => {
                  onSelectChat(chat.id);
                  navigate(`/chat?chatId=${chat.id}`);
                  if (isMobile) setOpen(false);
                }}
              >
                <span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                </span>
                {open && <span className="truncate flex-1">{chat.title || 'New Chat'}</span>}
                {open && (
                  <button
                    className="p-1 hover:bg-red-100 rounded transition"
                    title="Delete chat"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await deleteChat(chat.id);
                      setChats((prev) => prev.filter((c) => c.id !== chat.id));
                      if (selectedChatId === chat.id) {
                        onSelectChat(null);
                        navigate('/chat');
                      }
                    }}
                  >
                    <Trash size={16} className="text-red-500/50" />
                  </button>
                )}
              </div>
            ))
          )}
        </nav>
        {/* Settings at the bottom */}
        <div className="px-2 py-4 mt-auto">
          <Link
            to="/settings"
            className={cn(
              "flex items-center space-x-2 px-4 py-3 rounded-md transition-all",
              location.pathname.includes('/settings')
                ? "bg-primary text-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              !open && "justify-center"
            )}
            onClick={() => isMobile && setOpen(false)}
          >
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </span>
            {open && <span>Settings</span>}
          </Link>
        </div>
      </div>
    </div>
  );
};
