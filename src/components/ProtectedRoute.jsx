import React from 'react';
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react"; 

/**
 * @param {children} - El componente (página) que queremos proteger.
 * @param {boolean} requireAdmin - Si es true, solo deja pasar a admins. Si es false, deja pasar a cualquier usuario logueado.
 */
export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  // 1. ESTADO DE CARGA (Loading...)
  // Es vital mostrar esto mientras Firebase verifica la sesión, 
  // si no, el código pensará que "user" es null momentáneamente y te expulsará.
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary-600" size={48} />
        <p className="text-gray-500 font-medium animate-pulse">Verificando permisos...</p>
      </div>
    );
  }

  // 2. CHECK DE SESIÓN: ¿Hay usuario?
  // Si no hay usuario logueado, lo mandamos al Login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. CHECK DE ROL: ¿Requiere Admin?
  // Si la ruta pide Admin (requireAdmin={true}) Y el usuario NO es admin...
  // Lo mandamos al Inicio (Home).
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 4. ACCESO CONCEDIDO
  // Si pasa todas las pruebas, mostramos la página hija.
  return children;
};