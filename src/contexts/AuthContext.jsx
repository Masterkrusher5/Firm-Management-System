import React, { createContext, useState, useEffect, useContext } from 'react';
import { pb } from '../services/pocketbase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(pb.authStore.model);
  const [token, setToken] = useState(pb.authStore.model?.token);
  const [loadingAuth, setLoadingAuth] = useState(true);
  useEffect(() => {
    const removeListener = pb.authStore.onChange((newToken, newModel) => {
      setToken(newToken);
      setCurrentUser(newModel);
      setLoadingAuth(false);
    }, true);
    
    return () => removeListener();
  }, []);

  const staffLogin = async (email, password, secretCode) => {
    try { 
      const firm = await pb.collection('firms').getFirstListItem(`secret_code = "${secretCode}"`, {
          $autoCancel: false, 
      });
      const authData = await pb.collection('users').authWithPassword(email, password, {
          $autoCancel: false,
      });
      
      if (authData.record.firm_id !== firm.id) {
        pb.authStore.clear(); 
        throw new Error('You are not authorized to access this firm.');
      }
      await pb.collection('users').update(authData.record.id, { 'is_logged_in': true });
      return { firm, user: authData.record };
    } catch (err) {
      if (err.status === 404) {
        throw new Error("Invalid Firm Code. Please check and try again.");
      }
      if (err.status === 400) {
        throw new Error("Incorrect email or password.");
      }
      throw err;
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const authData = await pb.collection('admins').authWithPassword(email, password, {
          $autoCancel: false,
      });
      if (authData.record.is_logged_in) {
          pb.authStore.clear();
          throw new Error("This admin account is already in use. Please log out from other devices.");
      }
      await pb.collection('admins').update(authData.record.id, { 'is_logged_in': true });
    } catch (err) {
      if (err.status === 400) {
        throw new Error("Incorrect email or password.");
      }
      throw err;
    }
  };

  const logout = async () => {
    const user = pb.authStore.model;
    if (user) {
      try {
        await pb.collection(user.collectionName).update(user.id, { 'is_logged_in': false });
      } catch (error) {
        console.error("Failed to update user logout status on the server:", error);
      }
    }
    pb.authStore.clear();
  };
  
  const value = {
    currentUser,
    token,
    loadingAuth,
    isLoggedIn: !!token,
    isAdmin: currentUser?.collectionName === 'admins',
    isStaff: currentUser?.collectionName === 'users',
    staffLogin,
    adminLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};