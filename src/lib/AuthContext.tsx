import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User as AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync user with Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as AppUser;
          // Ensure primary user is always admin if they log in
          if (firebaseUser.email === 'rmasnanovita@gmail.com' && userData.role !== 'admin') {
            const updatedUser = { ...userData, role: 'admin' };
            await setDoc(userRef, { role: 'admin' }, { merge: true });
            setCurrentUser(updatedUser as AppUser);
          } else {
            setCurrentUser(userData);
          }
        } else {
          // New user registration
          const isAdminEmail = firebaseUser.email === 'rmasnanovita@gmail.com';
          const newUser: AppUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            google_id: firebaseUser.uid,
            avatar: firebaseUser.photoURL || '',
            role: isAdminEmail ? 'admin' : 'user',
          };
          await setDoc(userRef, newUser);
          setCurrentUser(newUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user: currentUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
