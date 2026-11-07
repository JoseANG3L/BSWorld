import React from 'react';
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * @param {children} - El componente (página) que queremos proteger.
 * @param {boolean} requireAdmin - Si es true, solo deja pasar a admins. Si es false, deja pasar a cualquier usuario logueado.
 */
export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. ESTADO DE CARGA (Loading...)
  // Es vital mostrar esto mientras Firebase verifica la sesión, 
  // si no, el código pensará que "user" es null momentáneamente y te expulsará.
  if (loading) {
    return <LoadingSpinner variant="fullscreen" />;
  }

  // 2. CHECK DE SESIÓN: ¿Hay usuario?
  // Si no hay usuario logueado, lo mandamos al Login.
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
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