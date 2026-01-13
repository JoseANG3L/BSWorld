import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Copia estos datos de tu consola de Firebase (Configuración del proyecto -> General -> Tus apps)
const firebaseConfig = {
  apiKey: "AIzaSyC0ZA7nkBG9wbj4mbI8s_uUGTyxexUxZgc",
  authDomain: "bsworld-mods.firebaseapp.com",
  projectId: "bsworld-mods",
  storageBucket: "bsworld-mods.firebasestorage.app",
  messagingSenderId: "748208976436",
  appId: "1:748208976436:web:8bf6493d0ce875a18ad061"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);