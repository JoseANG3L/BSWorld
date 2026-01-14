import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore"; 
import { auth, db } from "../firebase/config";

const AuthContext = createContext();

// 👇 ESTA PARTE ES LA QUE TE FALTA O ESTÁ MAL
// Tienes que exportar esta función para poder importarla con { useAuth } en el Header
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  // ... (El resto de tu código del AuthProvider igual que antes) ...
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email, password, username, avatarUrl) => {
    // ... tu lógica de signup ...
    // (Resumen para no hacer largo el código: crea usuario en auth y firestore)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    const finalAvatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    await updateProfile(firebaseUser, { displayName: username, photoURL: finalAvatar });
    await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        username: username,
        email: email,
        avatar: finalAvatar,
        role: "user",
        createdAt: new Date().toISOString()
    });
    setUser({ ...firebaseUser, displayName: username, photoURL: finalAvatar, role: "user" });
    return userCredential;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUser({ ...currentUser, ...docSnap.data() });
        else setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};