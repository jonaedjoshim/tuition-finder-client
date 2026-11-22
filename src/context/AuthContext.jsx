import { createContext, useContext, useState, useEffect, useRef } from 'react';
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

// A Firebase sign-in triggers onAuthStateChanged *before* the calling page has
// finished its own backend call. Without this guard the listener and the page
// race to create the Mongo user, and a tutor can end up stored as a student.
// `authFlowRef` is a counter because flows can overlap.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // backend user object (role, phone etc)
  const [firebaseUser, setFirebaseUser] = useState(null); // raw firebase user object
  const [loading, setLoading] = useState(true);
  const authFlowRef = useRef(0);

  const bootstrap = async (fbUser, role = 'student') => {
    const idToken = await fbUser.getIdToken();
    const res = await authAPI.bootstrap({
      idToken,
      name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'TuitionFinder User'),
      role,
    });
    const nextUser = res.data.user;
    setUser(nextUser);
    return nextUser;
  };

  useEffect(() => {
    // Fires on every login/logout/page refresh — this keeps the session alive
    // across reloads and self-heals a Firebase account that has no Mongo user.
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setFirebaseUser(fbUser);

      // An explicit register/login flow is in progress and will set the user
      // (with the correct role) itself.
      if (authFlowRef.current > 0) return;

      try {
        const res = await authAPI.getMe();
        setUser(res.data.user);
      } catch {
        // No backend user yet (first Google sign-in, interrupted signup, or a
        // user deleted from Mongo). Recreate it instead of leaving a ghost session.
        try {
          await bootstrap(fbUser, 'student');
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Email/Password Registration
  const register = async ({ name, email, phone, password, role }) => {
    authFlowRef.current += 1;
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      setFirebaseUser(credential.user);

      // bootstrap is idempotent: it verifies the Firebase token and mirrors the
      // user into MongoDB. It never grants the admin role.
      const idToken = await credential.user.getIdToken();
      const res = await authAPI.bootstrap({ idToken, name, phone, role });
      const nextUser = res.data.user;
      setUser(nextUser);
      return nextUser;
    } finally {
      authFlowRef.current -= 1;
      setLoading(false);
    }
  };

  // Email/Password Login
  const login = async (email, password) => {
    authFlowRef.current += 1;
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      setFirebaseUser(credential.user);
      const nextUser = await bootstrap(credential.user, 'student');
      return nextUser;
    } finally {
      authFlowRef.current -= 1;
      setLoading(false);
    }
  };

  // Google Login — used for both first-time sign-up and returning users.
  // bootstrap finds the existing Mongo user by firebaseUid, so the role chosen
  // at first sign-up is preserved on later logins.
  const loginWithGoogle = async (role = 'student') => {
    authFlowRef.current += 1;
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      setFirebaseUser(credential.user);
      return await bootstrap(credential.user, role);
    } finally {
      authFlowRef.current -= 1;
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    setLoading(false);
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
