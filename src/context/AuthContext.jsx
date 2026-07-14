import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // backend user object (role, phone etc)
  const [firebaseUser, setFirebaseUser] = useState(null); // raw firebase user object
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fires on every login/logout/page refresh — this is what keeps the
    // session alive across reloads, replacing the old localStorage check.
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const res = await authAPI.getMe();
          setUser(res.data.user);
        } catch (err) {
          // Backend has no matching user yet (e.g. mid-registration, or a
          // Google sign-in that hasn't completed the backend step).
          setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email/Password Registration
  const register = async ({ name, email, phone, password, role }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    const idToken = await credential.user.getIdToken();
    const res = await authAPI.register({ name, phone, role, idToken });
    setUser(res.data.user);
    return res.data.user;
  };

  // Email/Password Login
  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    const res = await authAPI.getMe();
    setUser(res.data.user);
    return res.data.user;
  };

  // Google Login — used for both first-time sign-up and returning users
  const loginWithGoogle = async (role = 'student') => {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);

    try {
      const res = await authAPI.getMe();
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      // No matching backend user yet — this is a brand new Google sign-in.
      const idToken = await credential.user.getIdToken();
      const res = await authAPI.register({
        name: credential.user.displayName,
        phone: '',
        role,
        idToken,
      });
      setUser(res.data.user);
      return res.data.user;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const updateUser = (data) => setUser((prev) => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, loading, register, login, loginWithGoogle, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
