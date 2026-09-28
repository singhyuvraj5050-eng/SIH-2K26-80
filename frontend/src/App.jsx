import { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={handleLogin} 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode} 
      />
    );
  }

  return (
    <Dashboard 
      currentUser={currentUser} 
      onLogout={handleLogout} 
      isDarkMode={isDarkMode} 
      setIsDarkMode={setIsDarkMode} 
    />
  );
}