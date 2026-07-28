import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// --- SISTEMA DE CACHÉ ---
const userCache = {}; 
const usernameMap = {};

// ---------------------------------------------------------
// 1-3. CONTENIDO (Obtención)
// ---------------------------------------------------------
export const getContentByType = async (tipo) => {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('tipo', tipo)
    .eq('estado', 'aceptado')
    .eq('visibilidad', 'publico')
    .order('creado', { ascending: false });
  if (error) throw error;
  return data;
};

export const getPublicContent = async () => {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('estado', 'aceptado')
    .eq('visibilidad', 'publico')
    .order('creado', { ascending: false });
  return error ? [] : data;
};

export const getAdminContent = async () => {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .order('creado', { ascending: false });
  return error ? [] : data;
};

export const getContentById = async (id, userId = null, userRole = null) => {
  const { data, error } = await supabase.from('content').select('*').eq('id', id).single();
  if (error) return null;
  
  // Control de acceso por visibilidad y estado
  if (data) {
    const visibilidad = data.visibilidad || 'publico';
    const estado = data.estado || data.status;
    const ownerId = data.aporte?.uid || data.aporte;
    
    // Admin puede ver todo el contenido
    if (userRole === 'admin') {
      return data;
    }
    
    // Si es privado, solo el dueño puede verlo
    if (visibilidad === 'privado') {
      if (userId !== ownerId) return null;
    }
    
    // Si está en borrador, solo el dueño puede verlo
    if (estado === 'borrador' || estado === 'draft') {
      if (userId !== ownerId) return null;
    }
    
    // Si está en revisión, solo el dueño puede verlo
    if (estado === 'revision' || estado === 'pending' || estado === 'en_revision') {
      if (userId !== ownerId) return null;
    }
    
    // Si es no-listado o publico, cualquiera puede verlo
  }
  
  return data;
};

export const getUserContent = async (uid) => {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('aporte', uid)
    .order('creado', { ascending: false });
  return error ? [] : data;
};

// ---------------------------------------------------------
// 4. GESTIÓN DE CONTENIDO (UPDATE/DELETE/CREATE)
// ---------------------------------------------------------
export const updateContent = async (id, data) => {
  const { data: currentData } = await supabase
    .from('content')
    .select('estado, aporte, titulo, tipo, imagen')
    .eq('id', id)
    .single();
  
  if (data.estado && currentData?.estado !== data.estado && (data.estado === 'published' || data.estado === 'rejected')) {
    const uploaderUid = currentData.aporte?.uid;
    if (uploaderUid) {
      await supabase.from('notifications').insert({
        userId: uploaderUid,
        modId: id,
        modTitle: data.titulo || currentData.titulo,
        modImage: data.imagen || currentData.imagen,
        modType: data.tipo || currentData.tipo,
        estado: data.estado,
        creado: new Date().toISOString(),
        leida: false
      });
    }
  }

  const { error } = await supabase
    .from('content')
    .update({ ...data, actualizado: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

export const deleteContent = async (id) => {
  const { error } = await supabase.from('content').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const createContent = async (data, isUserSubmission = false) => {
  const finalStatus = isUserSubmission ? 'pending' : (data.estado || 'published');
  const newId = uuidv4();

  const payload = { ...data, id: newId, creado: data.creado || new Date().toISOString(), estado: finalStatus, vistas: 0 };
  const { error } = await supabase.from('content').insert(payload);
  if (error) throw error;
  return newId;
};

// ---------------------------------------------------------
// 5. ESTADÍSTICAS (Vistas y Descargas)
// ---------------------------------------------------------
export const registerView = async (contentId) => {
  // En Supabase, para incrementar, es mejor usar una función RPC o un update simple
  // Aquí obtenemos el valor actual e incrementamos
  const { data } = await supabase.from('content').select('vistas').eq('id', contentId).single();
  await supabase.from('content').update({ vistas: (data?.vistas || 0) + 1 }).eq('id', contentId);
};

export const registerDownload = async (contentId, downloadUrl) => {
  const { data } = await supabase.from('content').select('descargas').eq('id', contentId).single();
  if (data?.descargas) {
    const updated = data.descargas.map(d => d.url === downloadUrl ? { ...d, count: (d.count || 0) + 1 } : d);
    await supabase.from('content').update({ descargas: updated }).eq('id', contentId);
  }
};

export const getGlobalStats = async () => {
  const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { data: content } = await supabase.from('content').select('descargas, estado').eq('estado', 'aceptado').eq('visibilidad', 'publico');
  
  let totalDownloads = 0;
  content.forEach(c => {
    if(c.descargas) totalDownloads += c.descargas.reduce((acc, curr) => acc + (curr.count || 0), 0);
  });
  return { users: usersCount || 0, downloads: totalDownloads, mods: content.length };
};

// ---------------------------------------------------------
// 6. USUARIOS Y CACHÉ
// ---------------------------------------------------------

// Modifica la función en tu archivo de servicios api.js
export const getUserPublicProfile = async (uid) => {
  if (!uid) return null;
  if (userCache[uid]) return userCache[uid];

  const { data, error } = await supabase.from('users').select('*').eq('id', uid).single();
  
  if (data && !error) {
    const profile = { 
      uid: data.id, 
      nombre: data.username, 
      imagen: data.avatar || null,
      verificado: !!data.verificado
    };
    userCache[uid] = profile;
    return profile;
  }
  return null;
};

export const getUserByUsername = async (username) => {
  const lowerUser = username.toLowerCase();
  if (usernameMap[lowerUser]) return getUserPublicProfile(usernameMap[lowerUser]);

  const { data, error } = await supabase.
    from('users')
    .select('*')
    .ilike('username', username)
    .maybeSingle();

  if (data && !error) {
    const profile = { uid: data.id, nombre: data.username, imagen: data.avatar || null };
    userCache[data.id] = profile;
    usernameMap[lowerUser] = data.id;
    return profile;
  }
  return null;
};

export const getAllUsers = async () => {
  const { data, error } = await supabase.from('users').select('*').order('createdat', { ascending: false });
  return error ? [] : data;
};

// 1. BUSCAR USUARIOS (Para el autocompletado en el formulario)
export const searchUsers = async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) return [];
  const term = searchTerm.toLowerCase();

  // Buscamos usuarios cuyo nombre_lower contenga el término
  const { data, error } = await supabase
    .from('users')
    .select('id, username, avatar')
    .ilike('username', `%${term}%`)
    .limit(5);

  if (error) return [];
  
  return data.map(u => ({
    uid: u.id,
    nombre: u.username,
    imagen: u.avatar
  }));
};

// 2. BUSCADOR GLOBAL (Para que SubirMod o el Header tengan funcionalidad de búsqueda)
export const searchGlobalContent = async (searchTerm) => {
  const term = searchTerm.toLowerCase();
  
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('estado', 'aceptado')
    .eq('visibilidad', 'publico')
    .or(`titulo.ilike.%${term}%,tags.cs.{${term}}`);

  if (error) return [];
  return data;
};

// --- NOTIFICACIONES ---
export const getUserNotifications = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', userId)
      .eq('leida', false)
      .order('creado', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ leida: true })
      .eq('id', notificationId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marcando notificación como leída:", error);
    throw error;
  }
};

// BUSCAR CONTENIDO POR CREADOR (Buscando dentro del array JSONB 'creadores')
export const getContentByCreator = async (creatorName) => {
  try {
    // En Supabase, usamos el operador @> para buscar elementos en un array JSONB
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .contains('creadores', JSON.stringify([{ nombre: creatorName }]))
      .eq('estado', 'aceptado')
      .eq('visibilidad', 'publico');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error buscando por creador:", error);
    return [];
  }
};

// --- ALIAS PARA COMPATIBILIDAD ---
export const getAllContent = getPublicContent;

// --- ELIMINAR NOTIFICACIÓN ---
export const deleteNotification = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error eliminando notificación:", error);
    throw error;
  }
};

// --- SISTEMA DE FOLLOWS (SEGUIDORES/SIGUIENDO) ---
export const followUser = async (followerId, followingId) => {
  try {
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    // Actualizar contadores
    await supabase.rpc('increment_followers', { user_id: followingId });
    await supabase.rpc('increment_following', { user_id: followerId });
    
    return true;
  } catch (error) {
    console.error("Error siguiendo usuario:", error);
    throw error;
  }
};

export const unfollowUser = async (followerId, followingId) => {
  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    
    if (error) throw error;
    
    // Actualizar contadores
    await supabase.rpc('decrement_followers', { user_id: followingId });
    await supabase.rpc('decrement_following', { user_id: followerId });
    
    return true;
  } catch (error) {
    console.error("Error dejando de seguir usuario:", error);
    throw error;
  }
};

export const isFollowing = async (followerId, followingId) => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();
    
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error("Error verificando follow:", error);
    return false;
  }
};

export const getFollowers = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id, users!follows_follower_id_fkey(username, avatar)')
      .eq('following_id', userId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo seguidores:", error);
    return [];
  }
};

export const getFollowing = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('following_id, users!follows_following_id_fkey(username, avatar)')
      .eq('follower_id', userId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo siguiendo:", error);
    return [];
  }
};

// --- SISTEMA DE LIKES PARA MODS ---
export const toggleLike = async (userId, contentId) => {
  try {
    // Verificar si ya existe el like
    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .maybeSingle();

    if (existingLike) {
      // Si existe, eliminar (unlike)
      // Los triggers manejarán automáticamente los contadores
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', contentId);

      if (error) throw error;
      return false; // Unlike
    } else {
      // Si no existe, crear (like)
      // Los triggers manejarán automáticamente los contadores
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          content_id: contentId,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true; // Like
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};

export const getContentLikes = async (contentId) => {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('content_id', contentId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo likes del contenido:", error);
    return [];
  }
};

export const getUserLikedContent = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('content_id, content(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo contenido liked:", error);
    return [];
  }
};

export const isLikedByUser = async (userId, contentId) => {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .maybeSingle();
    
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error("Error verificando like:", error);
    return false;
  }
};

// --- SISTEMA DE COMENTARIOS PARA MODS ---
export const getCommentsByContent = async (contentId) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*, users(username, avatar)')
      .eq('content_id', contentId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo comentarios:", error);
    return [];
  }
};

export const getRepliesByComment = async (commentId) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*, users(username, avatar)')
      .eq('parent_id', commentId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo respuestas:", error);
    return [];
  }
};

export const createComment = async (userId, contentId, text, parentId = null) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        content_id: contentId,
        parent_id: parentId,
        text: text
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creando comentario:", error);
    throw error;
  }
};

export const updateComment = async (commentId, text) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({ 
        text: text,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error actualizando comentario:", error);
    throw error;
  }
};

export const deleteComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error eliminando comentario:", error);
    throw error;
  }
};

export const getUserComments = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*, content(titulo, tipo, imagen)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo comentarios del usuario:", error);
    return [];
  }
};

// --- MODS RECOMENDADOS ---
export const getRecommendedContent = async (currentId, tipo, tags = [], limit = 5) => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('estado', 'aceptado')
      .eq('visibilidad', 'publico')
      .neq('id', currentId)
      .order('likes_count', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo contenido recomendado:", error);
    return [];
  }
};