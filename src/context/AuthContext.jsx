import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_STORAGE_KEY } from "../api/http";
import { getMe, loginUser, registerUser } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedSession = localStorage.getItem(AUTH_STORAGE_KEY);

        if (!savedSession) {
          setIsBootstrapping(false);
          return;
        }

        const parsed = JSON.parse(savedSession);

        if (!parsed?.token) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setIsBootstrapping(false);
          return;
        }

        setToken(parsed.token);

        const response = await getMe();
        const restoredUser = response?.data || null;

        if (!restoredUser) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setToken(null);
          setUser(null);
          setIsBootstrapping(false);
          return;
        }

        const newSession = {
          token: parsed.token,
          user: restoredUser,
        };

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession));
        setUser(restoredUser);
      } catch (error) {
        console.error("Error restoring auth session:", error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    };

    restoreSession();
  }, []);

  const login = async ({ email, password }) => {
    const response = await loginUser({
      email: email?.trim(),
      password,
    });

    const sessionToken = response?.data?.token;
    const sessionUser = response?.data?.user;

    if (!sessionToken || !sessionUser) {
      throw new Error("Respuesta inválida del servidor");
    }

    const session = {
      token: sessionToken,
      user: sessionUser,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setToken(sessionToken);
    setUser(sessionUser);

    return response;
  };

  const register = async ({ name, email, password }) => {
    const response = await registerUser({
      full_name: name?.trim(),
      email: email?.trim(),
      password,
      role: "admin",
    });

    const sessionToken = response?.data?.token;
    const sessionUser = response?.data?.user;

    if (!sessionToken || !sessionUser) {
      throw new Error("Respuesta inválida del servidor");
    }

    const session = {
      token: sessionToken,
      user: sessionUser,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setToken(sessionToken);
    setUser(sessionUser);

    return response;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isBootstrapping,
      login,
      register,
      logout,
    }),
    [user, token, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}