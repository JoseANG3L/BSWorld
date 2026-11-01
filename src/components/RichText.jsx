import React from 'react';
import { Link } from 'react-router-dom';
import { toInternalPath, splitTrail } from '../utils/linkify';

const USER_RE = /^@([A-Za-z0-9_][A-Za-z0-9_.]{0,19})$/;
const INTERNAL_RE = /^\/(view|u|foro|comunidad|mods|buscar|destacados|mis-mods|notificaciones|configuracion|acerca-de|contacto|ayuda|terminos|privacidad|cookies|licencias|login-page|subir|admin|edit)(\/[^\s<]*)?$/;

// Orden: URLs completas, www, menciones, rutas internas
const TOKEN_RE = /(https?:\/\/[^\s<]+|\bwww\.[^\s<]+|(?<![A-Za-z0-9_.@/])@[A-Za-z0-9_][A-Za-z0-9_.]{0,19}|\/(?:view|u|foro|comunidad|mods|buscar|destacados|mis-mods|notificaciones|configuracion|acerca-de|contacto|ayuda|terminos|privacidad|cookies|licencias|login-page|subir|admin|edit)(?:\/[^\s<]*)?)/g;

const linkClass = 'text-primary-500 hover:underline font-bold';

/**
 * Texto plano con auto-enlaces: URLs, @usuarios y rutas internas.
 * El contenedor padre conserva los saltos (whitespace-pre-wrap).
 */
const RichText = ({ text }) => {
  if (!text) return null;
  const parts = String(text).split(TOKEN_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        const [token, trail] = splitTrail(part);

        if (/^(https?:\/\/|\bwww\.)/.test(part) && token) {
          const href = token.startsWith('www.') ? `https://${token}` : token;
          const internal = toInternalPath(href);
          const el = internal ? (
            <Link key={i} to={internal} className={linkClass}>{token}</Link>
          ) : (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>{token}</a>
          );
          return <React.Fragment key={i}>{el}{trail}</React.Fragment>;
        }

        if (USER_RE.test(token)) {
          const name = token.slice(1);
          return (
            <React.Fragment key={i}>
              <Link to={`/u/${name}`} className={linkClass}>@{name}</Link>
              {trail}
            </React.Fragment>
          );
        }

        if (INTERNAL_RE.test(token)) {
          return (
            <React.Fragment key={i}>
              <Link to={token} className={linkClass}>{token}</Link>
              {trail}
            </React.Fragment>
          );
        }

        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};

export default RichText;
