import React, { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';

type MessageType = {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

export default function Chat() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setHasStartedChat(true);
    
    // Simulate bot typing
    setIsTyping(true);
    
    // Simulate bot response after a delay
    setTimeout(() => {
      const botMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };
  
  const handleQuickQuestion = (question: string) => {
    // Add user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      content: question,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages([userMessage]);
    setHasStartedChat(true);
    
    // Simulate bot typing
    setIsTyping(true);
    
    // Simulate bot response after a delay
    setTimeout(() => {
      const botMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(question),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };
  
  // Simple bot response logic
  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('hello') || input.includes('hi')) {
      return 'Hello! How can I assist you today?';
    } else if (input.includes('help')) {
      return 'I\'m here to help! You can ask me questions about our products, services, or just chat.';
    } else if (input.includes('bye') || input.includes('goodbye')) {
      return 'Goodbye! Have a great day!';
    } else if (input.includes('thanks') || input.includes('thank you')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    } else if (input.includes('weather')) {
      return 'I\'m sorry, I don\'t have access to real-time weather data. But I can help with product questions!';
    } else if (input.includes('name')) {
      return 'I\'m ChatBot, your friendly AI assistant! How can I make your day better?';
    } else if (input.includes('feature') || input.includes('product')) {
      return 'Our products offer cutting-edge features designed to enhance your productivity. Would you like to know more about a specific product?';
    } else if (input.includes('price') || input.includes('cost')) {
      return 'Our pricing is competitive and flexible. We offer different tiers to suit your needs. Would you like to see our pricing plans?';
    } else {
      return 'That\'s interesting. Can you tell me more about that?';
    }
  };

  // Quick questions for the welcome screen
  const quickQuestions = [
    "What features do your products offer?",
    "How does your pricing work?",
    "Can you tell me more about your company?"
  ];

  return (
    <MainLayout>
      <div className="flex flex-col h-screen bg-background pt-16 md:pt-0">
        {!hasStartedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="max-w-2xl w-full text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-30 animate-glow"></div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gradient-primary relative z-10">
                  Welcome to ChatBot
                </h1>
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
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
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
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Or type your question here..."
                    className="flex-1 bg-secondary border-secondary"
                  />
                  <Button type="submit" disabled={!inputValue.trim()}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="m3 3 3 9-3 9 19-9Z"/>
                      <path d="M6 12h16"/>
                    </svg>
                    Send
                  </Button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border bg-card">
              <h1 className="text-xl font-bold text-gradient-primary">Chat Assistant</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
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
                        ? 'bg-primary text-primary-foreground rounded-tr-none animate-chat-bubble-out'
                        : 'bg-secondary text-secondary-foreground rounded-tl-none animate-chat-bubble-in'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%] animate-chat-bubble-in">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-border bg-card">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary border-secondary"
                />
                <Button type="submit" disabled={!inputValue.trim() || isTyping}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="m3 3 3 9-3 9 19-9Z"/>
                    <path d="M6 12h16"/>
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
