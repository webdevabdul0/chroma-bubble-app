import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, User, UploadCloud, FileText, MessageCircle } from 'lucide-react';
import Player from 'lottie-react';
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import robotAnimation from '../../public/robot-animation.json';
import {
  getChatMessages,
  addMessageToChat,
  getChats,
  updateSystemMessage,
  ChatMessage,
  updateChatTitle,
  createChat,
} from '@/lib/firebaseChat';
import type { Chat as ChatType } from '@/lib/firebaseChat';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get('chatId');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [systemMessage, setSystemMessage] = useState('You are a helpful assistant.');
  const [systemMessageEdit, setSystemMessageEdit] = useState('');
  const [editingSystem, setEditingSystem] = useState(false);
  const [chat, setChat] = useState<ChatType | null>(null);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [chatMode, setChatMode] = useState<'normal' | 'pdf'>('normal');
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [showModeDialog, setShowModeDialog] = useState(false);

  // Load chat and messages
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (!chatId || !user) return;
    
    const loadChat = async () => {
      try {
        const chats = await getChats(user.uid);
        const found = chats.find(c => c.id === chatId);
        if (found) {
          setChat(found);
          setSystemMessage(found.systemMessage);
          setSystemMessageEdit(found.systemMessage);
          
          // Load messages after chat is set
          const msgs = await getChatMessages(chatId);
          setMessages(msgs.filter(m => m.userId === user.uid));
          setHasStartedChat(msgs.length > 0);
        } else {
          // If chat not found, redirect to new chat
          navigate('/chat');
        }
      } catch (error) {
        console.error('Error loading chat:', error);
        navigate('/chat');
      }
    };

    loadChat();
  }, [chatId, user, loading]);

  // Update chat title based on first message
  useEffect(() => {
    if (messages.length > 0 && !chat?.title) {
      const firstMessage = messages[0].content;
      const generateTitle = async () => {
        try {
          const response = await sendToOpenAI(
            `Generate a short, concise title (max 5 words) for this conversation based on the first message: "${firstMessage}". Return only the title, no additional text.`
          );
          const title = response.replace(/[""]/g, '').trim();
          if (chatId) {
            await updateChatTitle(chatId, title);
            // Update the local chat state with the new title
            setChat(prev => prev ? { ...prev, title } : null);
          }
        } catch (error) {
          console.error('Error generating title:', error);
          // Fallback to a truncated version of the first message
          const fallbackTitle = firstMessage.length > 30 
            ? firstMessage.substring(0, 30) + '...' 
            : firstMessage;
          if (chatId) {
            await updateChatTitle(chatId, fallbackTitle);
            setChat(prev => prev ? { ...prev, title: fallbackTitle } : null);
          }
        }
      };
      generateTitle();
    }
  }, [messages, chat?.title, chatId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing effect for bot response
  const typeBotMessage = async (fullText: string, baseMsg: Omit<ChatMessage, 'id'>) => {
    let displayed = '';
    for (let i = 0; i <= fullText.length; i++) {
      setMessages(prev => [
        ...prev.filter(m => m.sender !== 'bot' || m.timestamp !== baseMsg.timestamp),
        { ...baseMsg, content: fullText.slice(0, i), id: Date.now().toString() },
      ]);
      await new Promise(res => setTimeout(res, 15));
    }
    // Save final message to Firestore
    await addMessageToChat(chatId!, { ...baseMsg, content: fullText });
  };

  // Send to OpenAI with context
  const sendToOpenAI = async (userInput: string): Promise<string> => {
    const token = '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';
    const endpoint = 'https://models.github.ai/inference';
    const model = 'openai/gpt-4.1';
    const client = ModelClient(endpoint, new AzureKeyCredential(token));
    // Prepare context
    const contextMsgs = [
      { role: 'system', content: systemMessage },
      ...messages.slice(-10).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: userInput },
    ];
    try {
      const response = await client.path('/chat/completions').post({
        body: {
          messages: contextMsgs,
          temperature: 1.0,
          top_p: 1.0,
          model: model,
        },
      });
      if (isUnexpected(response)) {
        throw response.body.error;
      }
      return response.body.choices[0].message.content;
    } catch (err) {
      return "Sorry, I couldn't get a response from the assistant.";
    }
  };

  // Helper to hash PDF file
  async function hashFile(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Check Firestore for PDF hash
  async function checkPdfExists(hash: string): Promise<boolean> {
    const snap = await getDocs(collection(db, 'pdfs'));
    return snap.docs.some(doc => doc.id === hash);
  }

  // Save PDF hash to Firestore
  async function savePdfHash(hash: string) {
    await setDoc(doc(db, 'pdfs', hash), { uploadedAt: new Date() });
  }

  // Modified PDF upload handler
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const hash = await hashFile(file);
      setPdfId(hash);
      const exists = await checkPdfExists(hash);
      if (exists) {
        console.log('PDF was already embedded.');
        setUploading(false);
        setShowModeDialog(true);
        toast({ title: 'PDF Ready', description: 'This PDF was already embedded. Choose how you want to chat.' });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      // Upload to n8n as before
      const formData = new FormData();
      formData.append('file', file);
      await axios.post('http://localhost:5678/webhook-test/b4d9a6d2-b54c-4371-869b-3c3f1b38caa8', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await savePdfHash(hash);
      setShowModeDialog(true);
      toast({ title: 'PDF Ready', description: 'Choose how you want to chat.' });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error?.response?.data?.message || error.message || 'Failed to upload PDF.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Chat mode modal with animation
  const AnimatedDialog = ({ open, onOpenChange, children }: any) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col items-center gap-4 transition-all duration-300 transform scale-95 opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100">
        {children}
      </DialogContent>
    </Dialog>
  );

  // In the chat input handler, branch logic based on chatMode
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;
    if (!chatId) {
      const defaultTitle = 'New Chat';
      const defaultSystem = 'You are a helpful assistant.';
      const newChatId = await createChat(defaultTitle, defaultSystem, user.uid);
      navigate(`/chat?chatId=${newChatId}`);
      return;
    }
    if (chatMode === 'pdf' && pdfId) {
      // Get OpenAI embedding
      const embeddingRes = await axios.post('https://api.openai.com/v1/embeddings', {
        model: 'text-embedding-3-small',
        input: inputValue,
      }, {
        headers: { 'Authorization': `Bearer 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` }
      });
      const embedding = embeddingRes.data.data[0].embedding;
      // Query Pinecone via Netlify function
      const pineconeRes = await axios.post('/.netlify/functions/pinecone-query', {
        embedding,
        pdfId,
      });
      const contextChunks = pineconeRes.data.matches.map((m: any) => m.metadata.text).join('\n');
      // Send context + question to your existing chat completion logic
      const botContent = await sendToOpenAI(`${contextChunks}\n\nUser: ${inputValue}`);
      const botMessage: Omit<ChatMessage, 'id'> = {
        chatId,
        content: '',
        sender: 'bot',
        timestamp: new Date(),
        userId: user.uid,
      };
      await typeBotMessage(botContent, botMessage);
      setIsTyping(false);
      setInputValue('');
      return;
    }
    // Normal chat logic
    const userMessage: Omit<ChatMessage, 'id'> = {
      chatId,
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      userId: user.uid,
    };
    setMessages(prev => [...prev, { ...userMessage, id: Date.now().toString() }]);
    await addMessageToChat(chatId, userMessage);
    setInputValue('');
    setHasStartedChat(true);
    setIsTyping(true);

    // If this is the first message, generate a title using GPT
    if (messages.length === 0) {
      try {
        const response = await sendToOpenAI(
          `Generate a short, concise title (max 5 words) for this conversation based on the first message: "${inputValue}". Return only the title, no additional text.`
        );
        const title = response.replace(/["\"]/g, '').trim();
        await updateChatTitle(chatId, title);
        setChat(prev => prev ? { ...prev, title } : null);
      } catch (error) {
        console.error('Error generating title:', error);
        // Fallback to a truncated version of the first message
        const fallbackTitle = inputValue.length > 30 
          ? inputValue.substring(0, 30) + '...' 
          : inputValue;
        await updateChatTitle(chatId, fallbackTitle);
        setChat(prev => prev ? { ...prev, title: fallbackTitle } : null);
      }
    }

    // Call OpenAI API for bot response
    const botContent = await sendToOpenAI(userMessage.content);
    const botMessage: Omit<ChatMessage, 'id'> = {
      chatId,
      content: '',
      sender: 'bot',
      timestamp: new Date(),
      userId: user.uid,
    };
    await typeBotMessage(botContent, botMessage);
    setIsTyping(false);
  };

  // Add a button to exit PDF chat mode
  {chatMode === 'pdf' && (
    <button className="ml-2 px-3 py-1 rounded bg-muted text-xs" onClick={() => setChatMode('normal')}>Exit PDF Chat</button>
  )}

  // System message editing
  const handleSystemEdit = async () => {
    if (!chatId) return;
    setSystemMessage(systemMessageEdit);
    await updateSystemMessage(chatId, systemMessageEdit);
    setEditingSystem(false);
  };

  // Quick questions for the welcome screen
  const quickQuestions = [
    'What features do your products offer?',
    'How does your pricing work?',
    'Can you tell me more about your company?',
  ];

  // Format GPT response
  const formatGPTResponse = (text: string) => {
    // Split by double newlines to handle paragraphs
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map(paragraph => {
      // Handle bullet points
      if (paragraph.startsWith('- ')) {
        return `<ul><li>${paragraph.substring(2)}</li></ul>`;
      }
      
      // Handle bold text
      let formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Handle links
      formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
      
      // Handle code blocks
      formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-secondary px-1 py-0.5 rounded">$1</code>');
      
      return `<p>${formatted}</p>`;
    }).join('');
  };

  // Update the message display to use formatted content
  const renderMessage = (message: ChatMessage) => (
    <div
      key={message.id}
      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-start`}
    >
      {message.sender === 'bot' && (
        <div className="bg-primary/20 rounded-full p-2 mr-2 flex-shrink-0">
          <Bot size={18} className="text-primary" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          message.sender === 'user'
            ? 'bg-primary text-primary-foreground rounded-tr-none'
            : 'bg-secondary text-secondary-foreground rounded-tl-none'
        }`}
      >
        {message.sender === 'bot' ? (
          <div dangerouslySetInnerHTML={{ __html: formatGPTResponse(message.content) }} />
        ) : (
          <p>{message.content}</p>
        )}
        <p className="text-xs opacity-70 mt-1">
          {message.timestamp?.toDate ? message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </p>
      </div>
      {message.sender === 'user' && (
        <div className="bg-primary rounded-full p-2 ml-2 flex-shrink-0">
          <User size={18} className="text-primary-foreground" />
        </div>
      )}
    </div>
  );

  const handleQuickQuestion = async (question: string) => {
    if (!chatId || !user) return;
    if (chatMode === 'pdf' && pdfId) {
      // Get OpenAI embedding
      const embeddingRes = await axios.post('https://api.openai.com/v1/embeddings', {
        model: 'text-embedding-3-small',
        input: question,
      }, {
        headers: { 'Authorization': `Bearer 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` }
      });
      const embedding = embeddingRes.data.data[0].embedding;
      // Query Pinecone via Netlify function
      const pineconeRes = await axios.post('/.netlify/functions/pinecone-query', {
        embedding,
        pdfId,
      });
      const contextChunks = pineconeRes.data.matches.map((m: any) => m.metadata.text).join('\n');
      // Send context + question to your existing chat completion logic
      const botContent = await sendToOpenAI(`${contextChunks}\n\nUser: ${question}`);
      const botMessage: Omit<ChatMessage, 'id'> = {
        chatId,
        content: '',
        sender: 'bot',
        timestamp: new Date(),
        userId: user.uid,
      };
      await typeBotMessage(botContent, botMessage);
      setIsTyping(false);
      setInputValue('');
      return;
    }
    // Normal chat logic
    const userMessage: Omit<ChatMessage, 'id'> = {
      chatId,
      content: question,
      sender: 'user',
      timestamp: new Date(),
      userId: user.uid,
    };
    setMessages([{ ...userMessage, id: Date.now().toString() }]);
    await addMessageToChat(chatId, userMessage);
    setHasStartedChat(true);
    setIsTyping(true);
    // Call OpenAI API for bot response
    const botContent = await sendToOpenAI(question);
    const botMessage: Omit<ChatMessage, 'id'> = {
      chatId,
      content: '',
      sender: 'bot',
      timestamp: new Date(),
      userId: user.uid,
    };
    await typeBotMessage(botContent, botMessage);
    setIsTyping(false);
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-screen bg-background pt-16 md:pt-0">
        {(!hasStartedChat && !messages.length) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="max-w-2xl w-full text-center space-y-6">
              <div className="flex flex-col items-center">
                <div className="h-48 w-48 relative">
                  <Player animationData={robotAnimation} loop={true} className="w-full h-full" />
                </div>
                <div className="relative mt-2">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-30 animate-glow"></div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-gradient-primary relative z-10">
                    Welcome to Chroma Bubble
                  </h1>
                </div>
              </div>
              <p className="text-lg text-muted-foreground mx-auto max-w-lg">
                How can I assist you today? Ask me anything about our products, services, or just start a conversation.
              </p>
              <div className="grid gap-4 pt-8">
                {quickQuestions.map((question, index) => (
                  <Card
                    key={index}
                    className="border border-primary/20 bg-secondary/50 backdrop-blur-sm cursor-pointer transition-all hover:bg-primary/10 hover:border-primary/40 hover:scale-[1.02]"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    <CardContent className="p-4 flex items-center">
                      <div className="bg-primary/20 rounded-full p-2 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                      </div>
                      <div className="text-left">{question}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="w-full max-w-md mx-auto mt-8">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Or type your question here..."
                    className="flex-1 bg-secondary border-secondary"
                  />
                  <Button type="submit" disabled={!inputValue.trim()}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="m3 3 3 9-3 9 19-9Z" />
                      <path d="M6 12h16" />
                    </svg>
                    Send
                  </Button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
              <h1 className="text-xl font-bold text-gradient-primary flex-1">{chat?.title || 'New Chat'}</h1>
              <div>
                {editingSystem ? (
                  <div className="flex gap-2 items-center">
                    <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                      <div className="bg-primary/20 rounded-full p-1">
                        <Bot size={14} className="text-primary" />
                      </div>
                      <Input
                        value={systemMessageEdit}
                        onChange={e => setSystemMessageEdit(e.target.value)}
                        className="w-64 bg-background/50 border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-6 text-xs"
                      />
                    </div>
                    <Button size="sm" onClick={handleSystemEdit}>Save</Button>
                    <Button size="sm" variant="secondary" onClick={() => { setEditingSystem(false); setSystemMessageEdit(systemMessage); }}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                      <div className="bg-primary/20 rounded-full p-1">
                        <Bot size={14} className="text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">System: {systemMessage}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setEditingSystem(true)}>Edit</Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(renderMessage)}
              {isTyping && (
                <div className="flex justify-start items-start">
                  <div className="bg-primary/20 rounded-full p-2 mr-2 flex-shrink-0">
                    <Bot size={18} className="text-primary" />
                  </div>
                  <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                    <span className="text-muted-foreground">Assistant is typing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border bg-card">
              {/* PDF Upload UI */}
              <div className="flex items-center mb-2 gap-2">
                <input
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={handlePdfUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  aria-label="Upload PDF"
                >
                  <UploadCloud className="w-5 h-5" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Uploading PDF...' : 'Upload a PDF to the vector database'}
                </span>
              </div>
              {/* Main chat input */}
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary border-secondary"
                  disabled={isTyping}
                />
                <Button type="submit" disabled={!inputValue.trim() || isTyping}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="m3 3 3 9-3 9 19-9Z" />
                    <path d="M6 12h16" />
                  </svg>
                  Send
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
      <AnimatedDialog open={showModeDialog} onOpenChange={setShowModeDialog}>
        <h2 className="text-lg font-bold">How would you like to chat?</h2>
        <div className="flex gap-6">
          <button className="flex flex-col items-center p-4 rounded-lg border hover:bg-primary/10 transition-all duration-200" onClick={() => { setChatMode('normal'); setShowModeDialog(false); }}>
            <MessageCircle size={32} className="mb-2 text-primary" />
            <span>Normal Chat</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border hover:bg-primary/10 transition-all duration-200" onClick={() => { setChatMode('pdf'); setShowModeDialog(false); }}>
            <FileText size={32} className="mb-2 text-primary" />
            <span>Talk to PDF</span>
          </button>
        </div>
      </AnimatedDialog>
    </MainLayout>
  );
}
