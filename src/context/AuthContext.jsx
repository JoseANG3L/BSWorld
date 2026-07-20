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

  // --- FUNCIÓN SIGNUP (Registro tradicional por Email/Password) ---
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
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchUserProfile(session.user);
        limpiarHashUrl(); // 👈 Limpiamos el token de la barra de direcciones
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await fetchUserProfile(session.user);
        if (event === 'SIGNED_IN') {
          limpiarHashUrl(); // 👈 Limpiamos también en el evento de redirección entrante
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- CONTROL DE PERFIL E INSERCIÓN AUTOMÁTICA OAUTH (Google, GitHub, Discord) ---
  const fetchUserProfile = async (authUser) => {
    // Intentamos buscar si ya existe en la tabla pública 'users'
    let { data, error } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    
    // Si no existe (Caso típico del primer login con OAuth), lo insertamos dinámicamente
    if (error && error.code === 'PGRST116') { 
      const metadata = authUser.user_metadata;
      const provider = authUser.app_metadata?.provider || 'oauth';

      // 1. Extraer o generar el Username según el proveedor
      let baseUsername = '';
      if (provider === 'github') {
        baseUsername = metadata.preferred_username || metadata.user_name || metadata.name;
      } else if (provider === 'discord') {
        baseUsername = metadata.custom_claims?.username || metadata.name || metadata.full_name;
      } else {
        // Fallback para Google u otros
        baseUsername = metadata.full_name || metadata.name;
      }

      // Si no viene ningún nombre en la metadata, usamos la primera parte del correo
      if (!baseUsername && authUser.email) {
        baseUsername = authUser.email.split('@')[0];
      }

      // Normalizamos el username: minúsculas, sin espacios y agregamos un sufijo único de 4 caracteres
      const cleanName = baseUsername.replace(/\s+/g, '').toLowerCase();
      const uniqueUsername = `${cleanName}_${authUser.id.slice(0, 4)}`;

      // 2. Extraer el Avatar según el proveedor
      let userAvatar = metadata.avatar_url || metadata.picture;
      
      // Fallback si el proveedor no retornó imagen
      if (!userAvatar) {
        userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${uniqueUsername}`;
      }

      // 3. Estructura de datos final para insertar en la tabla pública 'users'
      const newUserData = {
        id: authUser.id,
        username: uniqueUsername,
        email: authUser.email || `${uniqueUsername}@cambiame.com`, // Fallback por si ocultaron el email en Github/Discord
        avatar: userAvatar,
        role: "user",
        verificado: false, 
        createdat: new Date().toISOString()
      };

      const { data: insertedData, error: insertError } = await supabase
        .from("users")
        .insert([newUserData])
        .select()
        .single();

      if (!insertError) {
        data = insertedData;
      } else {
        console.error(`Error al registrar perfil en cascada con ${provider}:`, insertError);
      }
    }

    setUser({ ...authUser, ...data });
  };

  // Auxiliar para remover los parámetros molestos de Google (#access_token=...)
  const limpiarHashUrl = () => {
    if (window.location.hash.includes('access_token')) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, signInWithProvider }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};