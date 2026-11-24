import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { getUnreadNotificationsCount, invalidateNotificationsCache } from "../services/api";

const AuthContext = createContext();
const NotificationsContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications debe usarse dentro de un AuthProvider");
  return context;
};

async function fetchUserProfile(authUser) {
  // Intentamos buscar si ya existe en la tabla pública 'users'
  let { data, error } = await supabase.from("users").select("*").eq("id", authUser.id).single();

  // Si no existe (Caso típico del primer login con OAuth), lo insertamos dinámicamente
  if (error && error.code === 'PGRST116') {
    const metadata = authUser.user_metadata || {};
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
    if (!baseUsername) baseUsername = 'usuario';

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
      createdat: new Date().toISOString(),
      descripcion: null
    };

    const { data: insertedData, error: insertError } = await supabase
      .from("users")
      .insert([newUserData])
      .select()
      .single();

    if (insertError) throw insertError;
    data = insertedData;
  } else if (error) {
    throw error;
  }

  return { ...authUser, ...data, role: data?.role || 'user' };
}

const limpiarHashUrl = () => {
  if (window.location.hash.includes('access_token')) {
    window.history.replaceState(window.history.state, document.title, window.location.pathname + window.location.search);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const pendingProfile = useRef(null);
  const [loading, setLoading] = useState(true);
  
  // Estado global de notificaciones para evitar duplicados
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

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
    // Validar longitud del username
    if (username.length > 20) {
      throw { code: "custom/username-too-long" };
    }

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
        createdat: new Date().toISOString(),
        descripcion: null
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateUserProfile = async (updates) => {
    if (!user) return;
    if (pendingProfile.current?.id === user.id) Object.assign(pendingProfile.current.edits, updates);
    setUser(prev => prev?.id === user.id ? { ...prev, ...updates } : prev);
  };

  // INITIAL_SESSION cubre la carga inicial. SIGNED_IN también se emite al volver a la pestaña.
  useEffect(() => {
    let mounted = true;
    let sessionUser = null;
    let retryProfile = false;
    const safetyTimeout = setTimeout(() => setLoading(false), 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      clearTimeout(safetyTimeout);
      const authUser = session?.user;
      if (!authUser) {
        sessionUser = null;
        retryProfile = false;
        pendingProfile.current = null;
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') limpiarHashUrl();
      const changedAccount = authUser.id !== sessionUser?.id;
      const newSignIn = authUser.last_sign_in_at !== sessionUser?.last_sign_in_at;
      if (!changedAccount && !newSignIn && event !== 'USER_UPDATED' && !retryProfile) return;

      sessionUser = authUser;
      retryProfile = false;
      const request = { id: authUser.id, edits: {} };
      pendingProfile.current = request;
      if (changedAccount) setUser({ ...authUser, role: 'user' });
      setLoading(false);
      fetchUserProfile(authUser).then(profile => {
        if (!mounted || pendingProfile.current !== request) return;
        pendingProfile.current = null;
        setUser({ ...profile, ...request.edits });
      }).catch(error => {
        if (!mounted || pendingProfile.current !== request) return;
        console.error("Error cargando perfil:", error);
        pendingProfile.current = null;
        retryProfile = true;
      });
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // --- NOTIFICACIONES GLOBALES ---

  // Funciones de notificaciones globales
  const userId = user?.id;
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    try {
      invalidateNotificationsCache(userId);
      const count = await getUnreadNotificationsCount(userId, true);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error cargando conteo de notificaciones:", error);
    }
  }, [userId]);

  const refreshNotifications = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Mantener el conteo global sincronizado con los cambios de la tabla.
  useEffect(() => {
    if (!userId) return undefined;

    const channel = supabase
      .channel(`notifications-count-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `userid=eq.${userId}`
        },
        fetchUnreadCount
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          fetchUnreadCount();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(`Error en la suscripción al conteo de notificaciones: ${status}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUnreadCount]);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, signInWithProvider, updateUserProfile }}>
      <NotificationsContext.Provider value={{ unreadCount, notifications, setNotifications, refreshNotifications }}>
        {children}
      </NotificationsContext.Provider>
    </AuthContext.Provider>
  );
};
