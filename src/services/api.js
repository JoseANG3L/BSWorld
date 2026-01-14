import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, // <--- IMPORTANTE: Necesario para filtrar
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Obtiene contenido filtrado por su tipo (ej: 'personaje', 'mapa')
 * @param {string} tipo - El valor del campo 'tipo' en Firebase
 */
export const getContentByType = async (tipo) => {
  try {
    const colRef = collection(db, "content"); // Tu colección única
    
    // Creamos una query: "Dame documentos de 'content' DONDE 'tipo' sea igual a 'personaje'"
    const q = query(colRef, where("tipo", "==", tipo));
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error obteniendo contenido tipo ${tipo}:`, error);
    throw error;
  }
};

/**
 * (Opcional) Para la barra de búsqueda global del Header
 * Busca en TODO el contenido sin importar el tipo
 */
export const searchGlobalContent = async (searchTerm) => {
  // Nota: Firestore básico no tiene búsqueda de texto parcial nativa (LIKE %text%).
  // Para prototipos, traemos todo y filtramos en el cliente (como en DataContainer).
  // Para producción, se suele usar Algolia o Typesense.
  const colRef = collection(db, "content");
  const snapshot = await getDocs(colRef);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return data.filter(item => 
    item.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

/**
 * Crea un nuevo documento en la colección 'content'
 * @param {object} data - Objeto con los datos limpios
 */
export const createContent = async (data) => {
  try {
    const colRef = collection(db, "content");
    
    // Si la data ya trae 'creado', lo usamos. Si no, usamos la fecha actual.
    const fechaCreacion = data.creado 
      ? new Date(data.creado).toISOString() 
      : new Date().toISOString();

    const docRef = await addDoc(colRef, {
      ...data,
      creado: fechaCreacion,
      actualizado: new Date().toISOString() // Esto siempre es "ahora"
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error creando contenido:", error);
    throw error;
  }
};