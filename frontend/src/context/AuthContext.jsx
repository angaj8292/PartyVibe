import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import wsService from '../services/websocket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('partyvibe_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('partyvibe_token'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
      localStorage.setItem('partyvibe_user', JSON.stringify(res.data));
    } catch (err) {
      console.warn('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
      wsService.connect();
    } else {
      setLoading(false);
    }

    return () => {
      wsService.disconnect();
    };
  }, [token]);

  const login = async (usernameOrEmail, password) => {
    const res = await api.post('/auth/login', { usernameOrEmail, password });
    const { token: jwt, user: userData } = res.data;
    localStorage.setItem('partyvibe_token', jwt);
    localStorage.setItem('partyvibe_user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    wsService.connect();
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token: jwt, user: userData } = res.data;
    localStorage.setItem('partyvibe_token', jwt);
    localStorage.setItem('partyvibe_user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    wsService.connect();
    return userData;
  };

  const logout = () => {
    wsService.disconnect();
    localStorage.removeItem('partyvibe_token');
    localStorage.removeItem('partyvibe_user');
    setToken(null);
    setUser(null);
  };

  const topUpCoins = async (amount = 1000) => {
    const res = await api.post('/wallet/test-topup', { amount });
    if (user) {
      const updatedUser = {
        ...user,
        coinsBalance: res.data.coinsBalance,
        vipLevel: res.data.vipLevel,
      };
      setUser(updatedUser);
      localStorage.setItem('partyvibe_user', JSON.stringify(updatedUser));
    }
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
        topUpCoins,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
