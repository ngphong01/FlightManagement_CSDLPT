import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type StaffUser = {
  id: number;
  employeeCode: string;
  full_name?: string;
  role: 'checkin' | 'gate' | 'support' | string;
  site?: 'hanoi'|'danang'|'saigon';
};

type StaffAuthValue = {
  staffUser: StaffUser | null;
  staffToken: string | null;
  isLoading: boolean;
  staffLogin: (user: StaffUser, token: string) => void;
  staffLogout: () => void;
};

const StaffAuthContext = createContext<StaffAuthValue | undefined>(undefined);

export const StaffAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [staffToken, setStaffToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const t = localStorage.getItem('staffToken');
        const u = localStorage.getItem('staffUser');
        
        if (t && u) {
          // For now, just set the user without verification
          // TODO: Add proper token verification later
          setStaffToken(t);
          setStaffUser(JSON.parse(u));
        }
      } catch (error) {
        console.error('Error initializing staff auth:', error);
        // Clear invalid data
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staffUser');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const staffLogin = (user: StaffUser, token: string) => {
    setStaffUser(user);
    setStaffToken(token);
    localStorage.setItem('staffUser', JSON.stringify(user));
    localStorage.setItem('staffToken', token);
  };

  const staffLogout = () => {
    setStaffUser(null);
    setStaffToken(null);
    localStorage.removeItem('staffUser');
    localStorage.removeItem('staffToken');
  };

  const value = useMemo(() => ({
    staffUser,
    staffToken,
    isLoading,
    staffLogin,
    staffLogout
  }), [staffUser, staffToken, isLoading]);

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
};

export const useStaffAuth = (): StaffAuthValue => {
  const context = useContext(StaffAuthContext);
  if (context === undefined) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
};

