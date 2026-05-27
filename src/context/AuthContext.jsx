import { createContext, useContext, useState, useEffect } from 'react';
import { api, enableDemoMode, isDemoMode } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    api.session()
      .then((data) => setUser(data.user))
      .catch((err) => {
        setUser(null);
        if (err.message === 'DEMO_MODE' || isDemoMode()) {
          enableDemoMode();
          setDemo(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.login({ email, password });
      setUser(data.user);
      setDemo(isDemoMode());
      return data.user;
    } catch (err) {
      if (err.message === 'DEMO_MODE') {
        enableDemoMode();
        setDemo(true);
        // Retry in demo mode
        const data = await api.login({ email, password });
        setUser(data.user);
        return data.user;
      }
      throw err;
    }
  };

  const register = async (fullname, email, phone, password, role) => {
    try {
      await api.register({ fullname, email, phone, password, role });
    } catch (err) {
      if (err.message === 'DEMO_MODE') {
        enableDemoMode();
        setDemo(true);
        await api.register({ fullname, email, phone, password, role });
        return;
      }
      throw err;
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, demo }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
