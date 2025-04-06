import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "./queryClient";
import { useLocation } from "wouter";

interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  username: null,
  login: async () => false,
  logout: () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check session status
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['/api/auth/session'],
    queryFn: async () => {
      const res = await fetch('/api/auth/session', { 
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error('Failed to get session');
      }
      return res.json();
    },
  });

  useEffect(() => {
    if (sessionData) {
      setIsLoggedIn(sessionData.isLoggedIn);
      setUsername(sessionData.username || null);
    }
  }, [sessionData]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string, password: string }) => {
      const res = await apiRequest('POST', '/api/login', { username, password });
      return res.json();
    },
    onSuccess: (data, variables) => {
      setIsLoggedIn(true);
      setUsername(variables.username);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      toast({
        title: "Login successful",
        description: "Welcome to the barber dashboard!",
      });
      navigate('/dashboard');
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/logout');
      return res.json();
    },
    onSuccess: () => {
      setIsLoggedIn(false);
      setUsername(null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      toast({
        title: "Logged out",
        description: "Successfully logged out",
      });
      navigate('/');
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      await loginMutation.mutateAsync({ username, password });
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const contextValue = {
    isLoggedIn,
    username,
    login,
    logout,
    isLoading
  };

  return React.createElement(
    AuthContext.Provider, 
    { value: contextValue },
    children
  );
};

export const useAuth = () => useContext(AuthContext);
