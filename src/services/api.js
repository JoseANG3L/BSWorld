import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ---------------------------------------------------------
// 1. OBTENER CONTENIDO POR TIPO (Para páginas de categorías)
// ---------------------------------------------------------
export const getContentByType = async (tipo) => {
  try {
    const colRef = collection(db, "content");
    const q = query(colRef, where("tipo", "==", tipo));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error obteniendo contenido tipo ${tipo}:`, error);
    throw error;
  }
};

// ---------------------------------------------------------
// 2. BUSCADOR GLOBAL (Para el Header y Resultados)
// ---------------------------------------------------------
export const searchGlobalContent = async (searchTerm) => {
  try {
    const colRef = collection(db, "content");
    const snapshot = await getDocs(colRef);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const term = searchTerm.toLowerCase();

    return data.filter(item => {
      // Coincidencia en el Título
      const titleMatch = item.titulo?.toLowerCase().includes(term);
      
      // Coincidencia en los Creadores (Busca dentro del array nombresBusqueda)
      const creatorMatch = item.nombresBusqueda?.some(nombre => 
        nombre.toLowerCase().includes(term)
      );
      
      return titleMatch || creatorMatch;
    });
  } catch (error) {
    console.error("Error en búsqueda:", error);
    return [];
  }
};

// ---------------------------------------------------------
// 3. CREAR CONTENIDO (Para AdminUpload)
// ---------------------------------------------------------
export const createContent = async (data) => {
  try {
    const colRef = collection(db, "content");
    
    const fechaCreacion = data.creado 
      ? new Date(data.creado).toISOString() 
      : new Date().toISOString();

    const docRef = await addDoc(colRef, {
      ...data,
      creado: fechaCreacion,
      actualizado: new Date().toISOString()
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error creando contenido:", error);
    throw error;
  }
};

// ---------------------------------------------------------
// 4. OBTENER TODOS LOS USUARIOS (Para Directorio Creadores)
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

// ---------------------------------------------------------
// 5. OBTENER CONTENIDO DE UN CREADOR (¡ESTA FALTABA!)
// ---------------------------------------------------------
export const getContentByCreator = async (creatorName) => {
  try {
    const colRef = collection(db, "content");
    // Buscamos donde el array 'nombresBusqueda' contenga el nombre exacto
    const q = query(colRef, where("nombresBusqueda", "array-contains", creatorName));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error buscando por creador:", error);
    return [];
  }
};

// ---------------------------------------------------------
// 6. OBTENER DATOS DE UN USUARIO (¡ESTA TAMBIÉN FALTABA!)
// ---------------------------------------------------------
export const getUserByUsername = async (username) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    // Retornamos el primer usuario que coincida
    return snapshot.docs[0].data();
  } catch (error) {
    console.error("Error buscando usuario:", error);
    return null;
  }
};