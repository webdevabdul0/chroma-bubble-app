
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/login');
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-12 w-12 rounded-full bg-primary animate-pulse-glow mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-2 text-gradient-primary">Loading ChatBot...</h1>
      </div>
    </div>
  );
};

export default Index;
