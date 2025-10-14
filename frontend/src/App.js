import React, { useState, useEffect } from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Logs from './pages/Logs';
import Alerts from './pages/Alerts';

function App() {

  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      setToken(storedToken);
    } else {
      console.log('No auth token found - please login');
    }
  }, []); 

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);  
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');         
    localStorage.removeItem('user');          
    setToken(null);                           
  };

  // ============================================================================
  // PROTECTED ROUTE COMPONENT
  // ============================================================================
  // Reusable component to avoid duplicate route protection logic
  // If user is authenticated → render the children (page component)
  // If not authenticated → redirect to login
  const ProtectedRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" />;
  };
  
  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={token ? <Navigate to="/logs" /> : <Login onLogin={handleLogin} />} 
        />

        <Route 
          path="/logs" 
          element={
            <ProtectedRoute>
              <Logs onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/alerts" 
          element={
            <ProtectedRoute>
              <Alerts onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/" 
          element={<Navigate to={token ? "/logs" : "/login"} />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
