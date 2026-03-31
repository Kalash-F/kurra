import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LearningPath = 'speaking' | 'speaking_script';
export type ExperienceLevel = 'beginner' | 'some_knowledge';
export type LearningGoal = 'family' | 'travel' | 'conversation' | 'culture';

interface UserProfile {
  hasOnboarded: boolean;
  path: LearningPath;
  experience: ExperienceLevel;
  goals: LearningGoal[];
  showRomanized: boolean;
  audioSpeed: 'slow' | 'normal';
  name?: string;
}

interface UserContextType {
  profile: UserProfile;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetProfile: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  hasOnboarded: false,
  path: 'speaking',
  experience: 'beginner',
  goals: [],
  showRomanized: true,
  audioSpeed: 'normal',
};

const UserContext = createContext<UserContextType>({
  profile: defaultProfile,
  isLoading: true,
  updateProfile: async () => {},
  resetProfile: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('userProfile').then((saved) => {
      if (saved) {
        try {
          setProfile({ ...defaultProfile, ...JSON.parse(saved) });
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    await AsyncStorage.setItem('userProfile', JSON.stringify(newProfile));
  }, [profile]);

  const resetProfile = useCallback(async () => {
    setProfile(defaultProfile);
    await AsyncStorage.removeItem('userProfile');
    await AsyncStorage.removeItem('progressData');
    await AsyncStorage.removeItem('streakData');
  }, []);

  return (
    <UserContext.Provider value={{ profile, isLoading, updateProfile, resetProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
