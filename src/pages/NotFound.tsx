import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    // Auto-redirect after countdown
    const interval = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    const timeout = setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-2 text-xl text-muted-foreground">Page introuvable</p>
        <p className="text-sm text-muted-foreground">
          Redirection vers l'accueil dans {countdown}s...
        </p>
      </div>
    </div>
  );
};

export default NotFound;
