import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';
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
} from '@/lib/firebaseChat';
import type { Chat as ChatType } from '@/lib/firebaseChat';
import { useAuth } from '@/contexts/AuthContext';

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

  // Load chat and messages
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (!chatId || !user) return;
    (async () => {
      const chats = await getChats(user.uid);
      const found = chats.find(c => c.id === chatId);
      if (found) {
        setChat(found);
        setSystemMessage(found.systemMessage);
        setSystemMessageEdit(found.systemMessage);
      }
      const msgs = await getChatMessages(chatId);
      setMessages(msgs.filter(m => m.userId === user.uid));
      setHasStartedChat(msgs.length > 0);
    })();
  }, [chatId, user, loading]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !chatId || !user) return;
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

  const handleQuickQuestion = async (question: string) => {
    if (!chatId || !user) return;
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

  return (
    <MainLayout>
      <div className="flex flex-col h-screen bg-background pt-16 md:pt-0">
        {(!hasStartedChat && !messages.length) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="max-w-2xl w-full text-center space-y-6">
              <div className="flex flex-col items-center">
                <Player
                  autoplay
                  loop
                  animationData={robotAnimation}
                  style={{ height: 180, width: 180 }}
                />
                <div className="relative mt-2">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-30 animate-glow"></div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-gradient-primary relative z-10">
                    Welcome to ChatBot
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
            <div className="p-4 border-b border-border bg-card flex items-center gap-4">
              <h1 className="text-xl font-bold text-gradient-primary flex-1">Chat Assistant</h1>
              <div>
                {editingSystem ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      value={systemMessageEdit}
                      onChange={e => setSystemMessageEdit(e.target.value)}
                      className="w-64"
                    />
                    <Button size="sm" onClick={handleSystemEdit}>Save</Button>
                    <Button size="sm" variant="secondary" onClick={() => { setEditingSystem(false); setSystemMessageEdit(systemMessage); }}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground">System: {systemMessage}</span>
                    <Button size="sm" variant="ghost" onClick={() => setEditingSystem(true)}>Edit</Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
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
                    <p>{message.content}</p>
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
              ))}
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
    </MainLayout>
  );
}
