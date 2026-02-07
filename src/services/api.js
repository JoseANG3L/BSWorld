import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  setDoc, // Cambiamos addDoc por setDoc para manejar IDs manuales si queremos, o mantenemos addDoc
  addDoc,
  increment,
  query, 
  where, 
  orderBy,
  startAt,
  endAt,
  limit,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid'; // Necesitas instalar: npm install uuid

const userCache = {};

// ---------------------------------------------------------
// 1. OBTENER CONTENIDO POR TIPO (PÚBLICO)
// ---------------------------------------------------------
export const getContentByType = async (tipo) => {
  try {
    const colRef = collection(db, "content");
    // MODIFICADO: Agregamos el filtro de status "active"
    const q = query(
      colRef, 
      where("tipo", "==", tipo), 
      where("status", "==", "active"), 
      orderBy("creado", "desc") // Ordenamos por fecha
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error obteniendo contenido tipo ${tipo}:`, error);
    // Si falla por falta de índice compuesto en Firebase, avisa en consola
    throw error;
  }
};

// ---------------------------------------------------------
// 2. OBTENER TODO EL CONTENIDO PÚBLICO (Para Destacados/Home)
// ---------------------------------------------------------
export const getPublicContent = async () => {
  try {
    const contentRef = collection(db, "content");
    // MODIFICADO: Solo traemos lo que está aprobado
    const q = query(contentRef, where("status", "==", "active"), orderBy("creado", "desc")); 
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error obteniendo contenido público:", error);
    return [];
  }
};

// ---------------------------------------------------------
// 3. OBTENER TODO (Para ADMIN PANEL - Ve pendientes y activos)
// ---------------------------------------------------------
export const getAdminContent = async () => {
  try {
    const contentRef = collection(db, "content");
    // Traemos TODO sin filtrar por status, ordenado por fecha
    const q = query(contentRef, orderBy("creado", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error obteniendo contenido admin:", error);
    return [];
  }
};

// A. OBTENER UN DOCUMENTO POR ID
export const getContentById = async (id) => {
  try {
    const docRef = doc(db, "content", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo documento:", error);
    return null;
  }
};

// --- OBTENER CONTENIDO DE UN USUARIO ESPECÍFICO ---
export const getUserContent = async (uid) => {
  try {
    const q = query(
      collection(db, "content"),
      where("aporte.uid", "==", uid),
      orderBy("creado", "desc") // Ordenar del más nuevo al más viejo
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al obtener mis mods:", error);
    return [];
  }
};

// B. ACTUALIZAR DOCUMENTO
export const updateContent = async (id, data) => {
  try {
    const docRef = doc(db, "content", id);
    await updateDoc(docRef, {
      ...data,
      actualizado: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error actualizando:", error);
    throw error;
  }
};

// C. ELIMINAR DOCUMENTO
export const deleteContent = async (id) => {
  try {
    const docRef = doc(db, "content", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error eliminando contenido:", error);
    throw error;
  }
};

// D. APROBAR CONTENIDO (NUEVA)
export const approveContent = async (id) => {
  try {
    const docRef = doc(db, "content", id);
    await updateDoc(docRef, { status: 'active' });
    return true;
  } catch (error) {
    console.error("Error aprobando contenido:", error);
    return false;
  }
};

// ---------------------------------------------------------
// 4. BUSCADOR GLOBAL (Filtrado)
// ---------------------------------------------------------
export const searchGlobalContent = async (searchTerm) => {
  try {
    const colRef = collection(db, "content");
    // Nota: Traemos todo y filtramos en cliente. 
    // Idealmente usarías Algolia/MeiliSearch para apps grandes.
    const snapshot = await getDocs(colRef);
    
    // MODIFICADO: Filtramos primero que sea "active"
    const data = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(item => item.status === 'active'); // <--- Solo buscar en activos
    
    const term = searchTerm.toLowerCase();

    return data.filter(item => {
      const titleMatch = item.titulo?.toLowerCase().includes(term);
      const creatorMatch = item.nombresBusqueda?.some(nombre => 
        nombre.toLowerCase().includes(term)
      );
      // También buscamos en tags
      const tagMatch = item.tags?.some(tag => tag.toLowerCase().includes(term));
      
      return titleMatch || creatorMatch || tagMatch;
    });
  } catch (error) {
    console.error("Error en búsqueda:", error);
    return [];
  }
};

// ---------------------------------------------------------
// 5. CREAR CONTENIDO (Lógica Dual: Usuario vs Admin)
// ---------------------------------------------------------
export const createContent = async (data, isUserSubmission = false) => {
  try {
    // Si usas uuid para generar IDs manuales (recomendado para consistencia)
    const newId = uuidv4();
    const docRef = doc(db, "content", newId);
    
    const fechaCreacion = data.creado 
      ? new Date(data.creado).toISOString() 
      : new Date().toISOString();

    const payload = {
      ...data,
      id: newId, // Guardamos el ID dentro del documento también
      creado: fechaCreacion,
      actualizado: new Date().toISOString(),
      // MODIFICADO: Si es usuario normal, forzamos "pending"
      status: isUserSubmission ? 'pending' : (data.status || 'active'),
      vistas: 0, // Inicializamos vistas/descargas internas
      descargas: data.descargas || []
    };

    // Usamos setDoc con ID manual
    await setDoc(docRef, payload);
    return newId;

  } catch (error) {
    console.error("Error creando contenido:", error);
    throw error;
  }
};

// ---------------------------------------------------------
// 6. USUARIOS Y CREADORES
// ---------------------------------------------------------
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc")); 
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return [];
  }
};

export const getContentByCreator = async (creatorName) => {
  try {
    const colRef = collection(db, "content");
    // MODIFICADO: Solo mostrar contenido activo en el perfil público
    const q = query(
        colRef, 
        where("nombresBusqueda", "array-contains", creatorName),
        where("status", "==", "active") 
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error buscando por creador:", error);
    return [];
  }
};

export const getUserByUsername = async (username) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    return snapshot.docs[0].data();
  } catch (error) {
    console.error("Error buscando usuario:", error);
    return null;
  }
};

// ---------------------------------------------------------
// 7. DESCARGAS Y ESTADÍSTICAS
// ---------------------------------------------------------
export const registerDownload = async (contentId, downloadUrl) => {
  try {
    const docRef = doc(db, "content", contentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      const updatedDescargas = data.descargas.map(item => {
        if (item.url === downloadUrl) {
          return { ...item, count: (item.count || 0) + 1 };
        }
        return item;
      });

      await updateDoc(docRef, {
        descargas: updatedDescargas
      });
      return true;
    }
  } catch (error) {
    console.error("Error registrando descarga:", error);
    return false;
  }
};

export const getGlobalStats = async () => {
  try {
    const usersColl = collection(db, "users");
    const usersSnapshot = await getCountFromServer(usersColl);
    const totalUsers = usersSnapshot.data().count;

    const contentColl = collection(db, "content");
    const contentSnapshot = await getDocs(contentColl);
    
    let totalContent = 0;
    let totalDownloads = 0;

    contentSnapshot.forEach(doc => {
      const data = doc.data();
      // Solo contamos estadísticas de contenido activo para no inflar números
      if (data.status === 'active') {
          totalContent++;
          if (data.descargas && Array.isArray(data.descargas)) {
            const descargasItem = data.descargas.reduce((acc, curr) => acc + (curr.count || 0), 0);
            totalDownloads += descargasItem;
          }
      }
    });

    return {
      users: totalUsers,
      downloads: totalDownloads,
      mods: totalContent
    };

  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return { users: 0, downloads: 0, mods: 0 };
  }
};

export const registerView = async (contentId) => {
  try {
    const docRef = doc(db, "content", contentId);
    // 'increment(1)' es una operación atómica de Firebase, es segura y rápida
    await updateDoc(docRef, {
      vistas: increment(1)
    });
  } catch (error) {
    console.error("Error registrando vista:", error);
  }
};

export const getUserPublicProfile = async (uid) => {
  if (!uid) return null;
  
  // Si ya lo pedimos hace un momento, devolver el de memoria (Ahorra lecturas)
  if (userCache[uid]) return userCache[uid];

  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const profile = {
        uid: uid,
        nombre: data.displayName || data.username || "Usuario",
        imagen: data.photoURL || data.avatar || null
      };
      userCache[uid] = profile; // Guardar en caché
      return profile;
    }
  } catch (error) {
    console.error("Error fetching user:", error);
  }
  return null;
};

// --- BUSCAR USUARIOS (Usando username_lower) ---
export const searchUsers = async (searchTerm) => {
  // 1. Validación básica
  if (!searchTerm || searchTerm.length < 2) return [];
  
  try {
    const usersRef = collection(db, "users");
    
    // 2. NORMALIZACIÓN CRÍTICA
    // Convertimos lo que el usuario escribe a minúsculas para que coincida con la BD.
    // Ej: Usuario escribe "Veg", buscamos "veg"
    const term = searchTerm.toLowerCase(); 

    // 3. QUERY ACTUALIZADA
    const q = query(
      usersRef, 
      orderBy('username_lower'), // <--- AQUÍ ESTÁ EL CAMBIO IMPORTANTE
      startAt(term), 
      endAt(term + '\uf8ff'),
      limit(5)
    );

    const querySnapshot = await getDocs(q);
    
    // 4. Mapeo de resultados
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        // OJO: Mostramos 'username' (original con mayúsculas) o 'displayName' para que se vea bonito.
        // No mostramos 'username_lower' al usuario final.
        nombre: data.displayName || data.username || "Usuario",
        imagen: data.avatar || data.photoURL || null
      };
    });

  } catch (error) {
    console.error("Error buscando usuarios:", error);
    return []; 
  }
};

// Función antigua para mantener compatibilidad si algo la usa
// (Redirige a getPublicContent)
export const getAllContent = getPublicContent;