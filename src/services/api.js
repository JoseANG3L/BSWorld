import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// --- SISTEMA DE CACHÉ ---
const userCache = {}; 
const usernameMap = {};
const notificationsCache = new Map(); // Cache para notificaciones
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos de TTL para cache

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
    .select('estado, visibilidad, aporte, titulo, tipo, imagen')
    .eq('id', id)
    .single();
  
  if (data.estado && currentData?.estado !== data.estado && (data.estado === 'published' || data.estado === 'rejected' || data.estado === 'pending')) {
    const uploaderUid = currentData.aporte?.uid;
    if (uploaderUid) {
      await createStatusNotification(
        uploaderUid,
        id,
        data.titulo || currentData.titulo,
        data.imagen || currentData.imagen,
        data.tipo || currentData.tipo,
        data.estado
      );
      
      // Si el estado es 'pending' o 'revision', notificar a los administradores
      if (data.estado === 'pending' || data.estado === 'revision') {
        await createAdminReviewNotification(
          id,
          data.titulo || currentData.titulo,
          data.imagen || currentData.imagen,
          data.tipo || currentData.tipo,
          uploaderUid
        );
      }
    }
  }

  if (data.visibilidad && currentData?.visibilidad !== data.visibilidad) {
    const uploaderUid = currentData.aporte?.uid;
    if (uploaderUid) {
      await createVisibilityNotification(
        uploaderUid,
        id,
        data.titulo || currentData.titulo,
        data.imagen || currentData.imagen,
        data.tipo || currentData.tipo,
        data.visibilidad
      );
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
  
  // Notificar al usuario que subió el contenido si está en revisión
  if (finalStatus === 'pending' || finalStatus === 'revision') {
    const uploaderUid = data.aporte?.uid || data.aporte;
    if (uploaderUid) {
      await createStatusNotification(
        uploaderUid,
        newId,
        data.titulo,
        data.imagen,
        data.tipo,
        finalStatus
      );
      
      // Notificar a los administradores sobre el contenido pendiente de revisión
      await createAdminReviewNotification(
        newId,
        data.titulo,
        data.imagen,
        data.tipo,
        uploaderUid
      );
    }
  }
  
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

export const registerDownload = async (contentId, downloadUrl, userId = null) => {
  const { data } = await supabase.from('content').select('descargas, aporte, titulo, imagen, tipo').eq('id', contentId).single();
  if (data?.descargas) {
    const updated = data.descargas.map(d => d.url === downloadUrl ? { ...d, count: (d.count || 0) + 1 } : d);
    await supabase.from('content').update({ descargas: updated }).eq('id', contentId);
    
    // Crear notificación de descarga si hay un usuario autenticado
    if (userId) {
      await createDownloadNotificationForContent(userId, contentId, data);
    }
  }
};

// Función auxiliar para crear notificación de descarga
const createDownloadNotificationForContent = async (actorId, contentId, content) => {
  try {
    const contentOwnerId = content.aporte?.uid || content.aporte;
    
    // No notificar al usuario si descarga su propio contenido
    if (contentOwnerId === actorId) return;
    
    // Crear notificación (solo con actorId)
    await createDownloadNotification(
      contentOwnerId,
      contentId,
      content.titulo,
      content.imagen,
      content.tipo,
      actorId
    );
  } catch (error) {
    console.error("Error creando notificación de descarga:", error);
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

// ÍNDICES RECOMENDADOS PARA SUPABASE (ejecutar en SQL Editor):
/*
-- Índice compuesto para consultas principales de notificaciones
CREATE INDEX IF NOT EXISTS idx_notifications_user_creado 
ON notifications(userId, creado DESC);

-- Índice para filtrar por leída/no leída
CREATE INDEX IF NOT EXISTS idx_notifications_user_leida 
ON notifications(userId, leida, creado DESC);

-- Índice para consultas por tipo
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(type, creado DESC);

-- Índice para contenido específico
CREATE INDEX IF NOT EXISTS idx_notifications_mod 
ON notifications(modId, creado DESC);

-- Índice para actor (usuario que realizó la acción)
CREATE INDEX IF NOT EXISTS idx_notifications_actor 
ON notifications(actorId, creado DESC);
*/

// Función auxiliar para crear notificaciones de diferentes tipos
export const createNotification = async (notificationData) => {
  try {
    console.log("DEBUG: createNotification llamado con:", notificationData);
    
    // Mapear nombres de columnas a snake_case para coincidir con la base de datos
    const dbData = {
      userid: notificationData.userId,
      modid: notificationData.modId,
      modtitle: notificationData.modTitle,
      modimage: notificationData.modImage,
      modtype: notificationData.modType,
      type: notificationData.type,
      estado: notificationData.estado,
      actorid: notificationData.actorId,
      commenttext: notificationData.commentText,
      parentid: notificationData.parentId,
      visibilidad: notificationData.visibilidad,
      creado: new Date().toISOString(),
      leida: false
    };
    
    const { error } = await supabase.from('notifications').insert(dbData);
    
    if (error) {
      console.error("DEBUG: Error insertando notificación:", error);
      throw error;
    }
    
    console.log("DEBUG: Notificación insertada exitosamente");
    return true;
  } catch (error) {
    console.error("Error creando notificación:", error);
    throw error;
  }
};

// Crear notificación de like
export const createLikeNotification = async (contentOwnerId, contentId, contentTitle, contentImage, contentType, actorId) => {
  return createNotification({
    userId: contentOwnerId,
    modId: contentId,
    modTitle: contentTitle,
    modImage: contentImage,
    modType: contentType,
    type: 'like',
    actorId
  });
};

// Crear notificación de comentario
export const createCommentNotification = async (contentOwnerId, contentId, contentTitle, contentImage, contentType, actorId, commentText, parentId = null) => {
  console.log("DEBUG: createCommentNotification llamado", { 
    contentOwnerId, contentId, contentTitle, actorId, commentText, parentId 
  });
  
  const result = await createNotification({
    userId: contentOwnerId,
    modId: contentId,
    modTitle: contentTitle,
    modImage: contentImage,
    modType: contentType,
    type: 'comment',
    actorId,
    commentText,
    parentId
  });
  
  console.log("DEBUG: createCommentNotification resultado:", result);
  return result;
};

// Crear notificación de descarga
export const createDownloadNotification = async (contentOwnerId, contentId, contentTitle, contentImage, contentType, actorId) => {
  return createNotification({
    userId: contentOwnerId,
    modId: contentId,
    modTitle: contentTitle,
    modImage: contentImage,
    modType: contentType,
    type: 'download',
    actorId
  });
};

// Crear notificación de cambio de estado (revisión, aceptado, rechazado)
export const createStatusNotification = async (contentOwnerId, contentId, contentTitle, contentImage, contentType, newStatus) => {
  return createNotification({
    userId: contentOwnerId,
    modId: contentId,
    modTitle: contentTitle,
    modImage: contentImage,
    modType: contentType,
    type: 'status',
    estado: newStatus
  });
};

// Crear notificación para administradores sobre contenido pendiente de revisión
export const createAdminReviewNotification = async (contentId, contentTitle, contentImage, contentType, contentOwnerId) => {
  try {
    // Obtener usuarios con rol de administrador
    const { data: admins, error } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');
    
    if (error) {
      console.error("Error obteniendo administradores:", error);
      return;
    }
    
    // Si no hay administradores, no hacer nada
    if (!admins || admins.length === 0) {
      console.log("No hay administradores configurados para notificaciones de revisión");
      return;
    }
    
    // Notificar a cada administrador
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        modId: contentId,
        modTitle: contentTitle,
        modImage: contentImage,
        modType: contentType,
        type: 'status',
        estado: 'pending',
        actorId: contentOwnerId // Para saber quién envió el contenido
      });
    }
    
    // Invalidar cache de los administradores
    for (const admin of admins) {
      invalidateNotificationsCache(admin.id);
    }
  } catch (error) {
    console.error("Error creando notificaciones de revisión para administradores:", error);
  }
};

// Crear notificación de cambio de visibilidad
export const createVisibilityNotification = async (contentOwnerId, contentId, contentTitle, contentImage, contentType, newVisibility) => {
  return createNotification({
    userId: contentOwnerId,
    modId: contentId,
    modTitle: contentTitle,
    modImage: contentImage,
    modType: contentType,
    type: 'visibility',
    visibilidad: newVisibility
  });
};

export const getUserNotifications = async (userId, onlyUnread = false, limit = 50, offset = 0, forceRefresh = false) => {
  try {
    console.log("DEBUG: getUserNotifications llamado", { userId, onlyUnread, limit, offset, forceRefresh });
    
    // Generar clave de cache
    const cacheKey = `${userId}_${onlyUnread}_${limit}_${offset}`;
    
    // Verificar cache si no es forzado
    if (!forceRefresh) {
      const cached = notificationsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log("DEBUG: Retornando datos del cache:", cached.data.length, "notificaciones");
        return cached.data;
      }
    }
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('userid', userId)
      .order('creado', { ascending: false })
      .range(offset, offset + limit - 1);

    if (onlyUnread) {
      query = query.eq('leida', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("DEBUG: Error en consulta de notificaciones:", error);
      throw error;
    }
    
    console.log("DEBUG: Notificaciones obtenidas de DB:", data?.length);
    
    // Guardar en cache
    notificationsCache.set(cacheKey, {
      data: data || [],
      timestamp: Date.now()
    });
    
    return data || [];
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return [];
  }
};

export const getUnreadNotificationsCount = async (userId, forceRefresh = false) => {
  try {
    // Generar clave de cache
    const cacheKey = `count_${userId}`;
    
    // Verificar cache si no es forzado
    if (!forceRefresh) {
      const cached = notificationsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('userid', userId)
      .eq('leida', false);

    if (error) throw error;
    
    const result = count || 0;
    
    // Guardar en cache
    notificationsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.error("Error al obtener conteo de notificaciones no leídas:", error);
    return 0;
  }
};

// Invalidar cache de notificaciones para un usuario específico
export const invalidateNotificationsCache = (userId) => {
  const keysToDelete = [];
  for (const key of notificationsCache.keys()) {
    if (key.startsWith(userId)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => notificationsCache.delete(key));
};

export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ leida: true })
      .eq('id', notificationId);
      
    if (error) throw error;
    
    // Invalidar cache si se proporciona userId
    if (userId) {
      invalidateNotificationsCache(userId);
    }
    
    return true;
  } catch (error) {
    console.error("Error marcando notificación como leída:", error);
    throw error;
  }
};

export const markNotificationAsUnread = async (notificationId, userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ leida: false })
      .eq('id', notificationId);
      
    if (error) throw error;
    
    // Invalidar cache si se proporciona userId
    if (userId) {
      invalidateNotificationsCache(userId);
    }
    
    return true;
  } catch (error) {
    console.error("Error marcando notificación como no leída:", error);
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
      
      // Crear notificación al creador del contenido
      await createLikeNotificationForContent(userId, contentId);
      
      return true; // Like
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};

// Función auxiliar para crear notificación de like
const createLikeNotificationForContent = async (actorId, contentId) => {
  try {
    // Obtener información del contenido
    const { data: content } = await supabase
      .from('content')
      .select('aporte, titulo, imagen, tipo')
      .eq('id', contentId)
      .single();
    
    if (!content) return;
    
    const contentOwnerId = content.aporte?.uid || content.aporte;
    
    // No notificar al usuario si le da like a su propio contenido
    if (contentOwnerId === actorId) return;
    
    // Crear notificación (solo con actorId)
    await createLikeNotification(
      contentOwnerId,
      contentId,
      content.titulo,
      content.imagen,
      content.tipo,
      actorId
    );
  } catch (error) {
    console.error("Error creando notificación de like:", error);
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
      .select('*, users(username, avatar), replies:comments(id)')
      .eq('content_id', contentId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Agregar replies_count manualmente
    const commentsWithCount = (data || []).map(comment => ({
      ...comment,
      replies_count: comment.replies?.length || 0
    }));
    
    return commentsWithCount;
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
    console.log("DEBUG: createComment llamado", { userId, contentId, text, parentId });
    
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
    
    if (error) {
      console.error("DEBUG: Error insertando comentario:", error);
      throw error;
    }
    
    console.log("DEBUG: Comentario insertado:", data);
    
    // Crear notificación de comentario
    await createCommentNotificationForContent(userId, contentId, text, parentId);
    
    return data;
  } catch (error) {
    console.error("Error creando comentario:", error);
    throw error;
  }
};

// Función auxiliar para crear notificación de comentario
const createCommentNotificationForContent = async (actorId, contentId, commentText, parentId = null) => {
  try {
    console.log("DEBUG: Creando notificación de comentario", { actorId, contentId, commentText, parentId });
    
    // Obtener información del contenido
    const { data: content } = await supabase
      .from('content')
      .select('aporte, titulo, imagen, tipo')
      .eq('id', contentId)
      .single();
    
    console.log("DEBUG: Contenido obtenido:", content);
    console.log("DEBUG: Tipo de campo aporte:", typeof content.aporte, "Valor:", content.aporte);
    
    if (!content) {
      console.log("DEBUG: No se encontró el contenido");
      return;
    }
    
    const contentOwnerId = content.aporte?.uid || content.aporte;
    console.log("DEBUG: ID del dueño del contenido:", contentOwnerId);
    console.log("DEBUG: ID del actor:", actorId);
    console.log("DEBUG: ¿Son el mismo usuario?", contentOwnerId === actorId);
    
    // No notificar al usuario si comenta su propio contenido
    if (contentOwnerId === actorId) {
      console.log("DEBUG: Usuario comentando su propio contenido, no notificar");
      return;
    }
    
    // Si es una respuesta, notificar al dueño del comentario original
    if (parentId) {
      console.log("DEBUG: Es una respuesta a otro comentario");
      const { data: parentComment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', parentId)
        .single();
      
      if (parentComment && parentComment.user_id !== actorId) {
        console.log("DEBUG: Notificando al dueño del comentario original:", parentComment.user_id);
        await createCommentNotification(
          parentComment.user_id,
          contentId,
          content.titulo,
          content.imagen,
          content.tipo,
          actorId,
          commentText,
          parentId // Pasar el parentId para respuestas
        );
        
        invalidateNotificationsCache(parentComment.user_id);
      }
    } else {
      // Notificar al dueño del contenido
      console.log("DEBUG: Notificando al dueño del contenido:", contentOwnerId);
      await createCommentNotification(
        contentOwnerId,
        contentId,
        content.titulo,
        content.imagen,
        content.tipo,
        actorId,
        commentText,
        null // parentId es null para comentarios directos
      );
      
      // Invalidar cache para que el usuario vea la notificación inmediatamente
      console.log("DEBUG: Invalidando cache para usuario:", contentOwnerId);
      invalidateNotificationsCache(contentOwnerId);
    }
    
    console.log("DEBUG: Notificación de comentario creada exitosamente");
  } catch (error) {
    console.error("Error creando notificación de comentario:", error);
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

export const getCommentCountByContent = async (contentId) => {
  try {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', contentId);
    return error ? 0 : count || 0;
  } catch (error) {
    return 0;
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