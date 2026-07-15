import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signInWithProvider = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider, // 'google', 'github', 'discord'
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  };

  // --- FUNCIÓN SIGNUP (Registro en Supabase) ---
  const signup = async (email, password, username, avatarUrl) => {
    // 1. Verificar si el username ya existe en la tabla 'users'
    const { data: existingUser } = await supabase
      .from("users")
      .select("username")
      .ilike("username", username)
      .maybeSingle();

    if (existingUser) {
      throw { code: "custom/username-taken" };
    }

    // 2. Registrar usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, avatar: avatarUrl }
      }
    });
    if (authError) throw authError;

    // 3. Crear registro en la tabla 'users'
    const finalAvatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    const { error: dbError } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        username: username,
        email: email,
        avatar: finalAvatar,
        role: "user",
        createdat: new Date().toISOString()
      }
    ]);
    
    if (dbError) {
      if (dbError.code === '23505') {
        throw { code: "custom/username-taken" };
      }
      throw dbError;
    }

    return authData;
  };

  // --- LOGIN / LOGOUT ---
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // --- GESTIÓN DE SESIÓN ---
  useEffect(() => {
    // Obtener sesión inicial
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    getSession();

    // Suscribirse a cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser) => {
    const { data } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    setUser({ ...authUser, ...data });
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, signInWithProvider }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};