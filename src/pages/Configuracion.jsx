import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import {
  User, Camera, Save, Calendar, Shield, CheckCircle, AlertCircle, Palette,
  Link as LinkIcon, Youtube, Twitter, Instagram, Linkedin, Github, Globe,
  MessageCircle, Trash2, Eye, EyeOff, ExternalLink, Check, RotateCcw, Lock
} from 'lucide-react';
import { clsx } from 'clsx';
import { ICON_MAP } from '../components/AvatarRenderer';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../hooks/useToast';

// --- CONSTANTES ---
const AVATAR_ICONS_MAP = ICON_MAP;
const AVATAR_ICON_NAMES = Object.keys(AVATAR_ICONS_MAP);

const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b',
  '#18181b', '#78350f', '#881337', '#1e3a8a', '#134e4a'
];

const SOCIAL_FIELDS = [
  { name: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@tu-canal', accent: 'group-focus-within:text-red-500' },
  { name: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://x.com/tu-usuario', accent: 'group-focus-within:text-sky-400' },
  { name: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/tu-usuario', accent: 'group-focus-within:text-pink-500' },
  { name: 'discord', label: 'Discord', icon: MessageCircle, placeholder: 'https://discord.gg/servidor', accent: 'group-focus-within:text-indigo-500' },
  { name: 'github', label: 'GitHub', icon: Github, placeholder: 'https://github.com/tu-usuario', accent: 'group-focus-within:text-gray-700 dark:group-focus-within:text-gray-200' },
  { name: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/tu-usuario', accent: 'group-focus-within:text-blue-600' },
  { name: 'website', label: 'Sitio web', icon: Globe, placeholder: 'https://tu-sitio.com', accent: 'group-focus-within:text-purple-500' }
];

const INPUT_CLASS = 'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500';

const getPasswordStrength = (password) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
};

const STRENGTH_META = [
  { label: '', color: 'bg-gray-200 dark:bg-white/10' },
  { label: 'Débil', color: 'bg-red-500' },
  { label: 'Regular', color: 'bg-amber-500' },
  { label: 'Buena', color: 'bg-lime-500' },
  { label: 'Fuerte', color: 'bg-emerald-500' }
];

const SectionCard = ({ icon, title, description, children, tone = 'default', action }) => {
  const Icon = icon;

  return (
  <section
    className={clsx(
      'overflow-hidden rounded-2xl border shadow-sm',
      tone === 'danger'
        ? 'border-red-200 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/10'
        : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1b1e]'
    )}
  >
    <div
      className={clsx(
        'flex items-start gap-3 border-b px-4 py-4 sm:px-5',
        tone === 'danger'
          ? 'border-red-100 dark:border-red-900/30'
          : 'border-gray-100 dark:border-gray-800'
      )}
    >
      <div
        className={clsx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          tone === 'danger'
            ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
            : 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400'
        )}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className={clsx(
          'text-sm font-bold sm:text-base',
          tone === 'danger' ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-white'
        )}>
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {action}
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </section>
  );
};

const Configuracion = () => {
  const { user, updateUserProfile } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    username: '',
    avatar: '',
    banner: '',
    descripcion: '',
    youtube: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    github: '',
    discord: '',
    website: ''
  });
  const [initialForm, setInitialForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [avatarTab, setAvatarTab] = useState('url');
  const [selectedIcon, setSelectedIcon] = useState('User');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');

  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  useEffect(() => {
    if (!user) return;

    const nextForm = {
      username: user.username || '',
      avatar: user.avatar || '',
      banner: user.banner || '',
      descripcion: user.descripcion || '',
      youtube: user.youtube || '',
      twitter: user.twitter || '',
      instagram: user.instagram || '',
      linkedin: user.linkedin || '',
      github: user.github || '',
      discord: user.discord || '',
      website: user.website || ''
    };

    setFormData(nextForm);
    setInitialForm(nextForm);

    if (user.avatar && user.avatar.startsWith('design|')) {
      const parts = user.avatar.split('|');
      if (parts.length === 3) {
        setAvatarTab('design');
        setSelectedIcon(parts[1]);
        setSelectedColor(parts[2]);
      }
    }
  }, [user]);

  const isDirty = initialForm
    ? JSON.stringify(formData) !== JSON.stringify(initialForm)
    : false;

  const filledSocials = SOCIAL_FIELDS.filter((social) => formData[social.name]?.trim()).length;
  const completion = Math.round(
    (([formData.username, formData.descripcion, formData.avatar].filter(Boolean).length + (filledSocials > 0 ? 1 : 0)) / 4) * 100
  );

  const handleChange = (event) => {
    setMessage({ type: '', text: '' });
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const updateAvatarDesign = (newIcon, newColor) => {
    setSelectedIcon(newIcon);
    setSelectedColor(newColor);
    setFormData((prev) => ({
      ...prev,
      avatar: `design|${newIcon}|${newColor}`
    }));
  };

  const resetProfile = () => {
    if (!initialForm) return;
    setFormData(initialForm);
    setMessage({ type: '', text: '' });
    if (initialForm.avatar?.startsWith('design|')) {
      const [, icon, color] = initialForm.avatar.split('|');
      setSelectedIcon(icon || 'User');
      setSelectedColor(color || '#3b82f6');
    }
    showToast('Cambios descartados', 'info');
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      if (!user) throw new Error('No hay sesión activa');

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Las contraseñas nuevas no coinciden');
      }
      if (passwordData.newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;

      setPasswordData({ newPassword: '', confirmPassword: '' });
      setPasswordMessage({ type: '', text: '' });
      showToast('Contraseña actualizada correctamente');
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordMessage({ type: 'error', text: error.message || 'Error al cambiar contraseña' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'ELIMINAR') {
      showToast('Debes escribir ELIMINAR para confirmar', 'error');
      return;
    }

    setDeleteLoading(true);
    try {
      if (!user) throw new Error('No hay sesión activa');

      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (dbError) throw dbError;

      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Delete account error:', error);
      showToast('Error al eliminar cuenta: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderPreviewAvatar = () => {
    const avatarSrc = formData.avatar;

    if (avatarSrc && avatarSrc.startsWith('design|')) {
      const parts = avatarSrc.split('|');
      const IconComp = AVATAR_ICONS_MAP[parts[1]] || User;
      const colorHex = parts[2] || '#3b82f6';

      return (
        <div className="flex h-full w-full select-none items-center justify-center rounded-full text-white" style={{ backgroundColor: colorHex }}>
          <IconComp style={{ width: '55%', height: '55%' }} strokeWidth={1.5} />
        </div>
      );
    }

    return (
      <img
        src={avatarSrc || '/default.jpg'}
        alt="Avatar"
        className="h-full w-full rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (!user) throw new Error('No hay sesión activa');

      if (formData.username !== user.username) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('username')
          .ilike('username', formData.username)
          .neq('id', user.id)
          .maybeSingle();

        if (existingUser) throw new Error('El nombre de usuario ya está en uso');
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: { username: formData.username, avatar: formData.avatar }
      });
      if (authError) {
        if (authError.message.includes('duplicate')) {
          throw new Error('El nombre de usuario ya está en uso');
        }
        throw new Error('Error al actualizar autenticación: ' + authError.message);
      }

      const { error: dbError } = await supabase
        .from('users')
        .update({
          username: formData.username,
          avatar: formData.avatar,
          banner: formData.banner,
          descripcion: formData.descripcion,
          youtube: formData.youtube,
          twitter: formData.twitter,
          instagram: formData.instagram,
          linkedin: formData.linkedin,
          github: formData.github,
          discord: formData.discord,
          website: formData.website
        })
        .eq('id', user.id);

      if (dbError) {
        if (dbError.code === '23505') throw new Error('El nombre de usuario ya está en uso');
        throw new Error('Error al actualizar perfil: ' + dbError.message);
      }

      updateUserProfile({
        username: formData.username,
        avatar: formData.avatar,
        banner: formData.banner,
        descripcion: formData.descripcion
      });

      setInitialForm(formData);
      showToast('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Profile update error:', error);

      let errorMessage = 'Error al actualizar perfil';
      if (error.message) {
        if (error.message.includes('duplicate')) {
          errorMessage = 'El nombre de usuario ya está en uso';
        } else if (error.message.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu internet';
        } else {
          errorMessage = error.message;
        }
      }
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const joinDate = user?.createdat
    ? new Date(user.createdat).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Desconocida';

  const isDesignAvatar = formData.avatar?.startsWith('design|');
  const banner = formData.banner;
  const bannerStyle = banner
    ? banner.startsWith('linear-gradient')
      ? { backgroundImage: banner }
      : { backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-2 py-4 animate-fade-in-up md:px-4 md:py-6" style={{ animationDuration: '200ms' }}>

      {/* CABECERA */}
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-500 text-white shadow-lg shadow-primary-500/25">
            <User size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white md:text-2xl">Configuración</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              Administra tu perfil, enlaces y seguridad.
            </p>
          </div>
        </div>

        <Link
          to={`/u/${user?.username || ''}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 transition-all hover:border-primary-300 hover:text-primary-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-200 dark:hover:border-primary-700 dark:hover:text-primary-400"
        >
          <ExternalLink size={14} />
          Ver perfil público
        </Link>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">

        {/* VISTA PREVIA */}
        <aside className="lg:sticky lg:top-20">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#1a1b1e]">
            <div
              className="h-24 bg-gradient-to-r from-primary-500 to-indigo-500"
              style={bannerStyle}
            />

            <div className="px-4 pb-4">
              <div className="-mt-10 mb-3 flex items-end justify-between">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-white shadow-lg ring-4 ring-white dark:bg-[#2a2c31] dark:ring-[#1a1b1e]">
                  {renderPreviewAvatar()}
                </div>
                <span className={clsx(
                  'mb-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide',
                  user?.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                )}>
                  <Shield size={11} />
                  {user?.role === 'admin' ? 'Admin' : 'Miembro'}
                </span>
              </div>

              <h2 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                {formData.username || 'Usuario'}
              </h2>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>

              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                <Calendar size={12} className="text-primary-500" />
                Miembro desde {joinDate}
              </div>

              {formData.descripcion && (
                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  {formData.descripcion}
                </p>
              )}

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-gray-500 dark:text-gray-400">Perfil completado</span>
                  <span className={completion === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary-600 dark:text-primary-400'}>
                    {completion}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all duration-500',
                      completion === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary-500 to-indigo-500'
                    )}
                    style={{ width: `${completion}%` }}
                  />
                </div>
                {completion < 100 && (
                  <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                    Añade una descripción, avatar y al menos una red social.
                  </p>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENIDO */}
        <div className="min-w-0 space-y-5">

          <form id="profile-form" onSubmit={handleSubmit} className="space-y-5">
            {message.text && (
              <div className={clsx(
                'flex items-start gap-2 rounded-xl border px-3.5 py-3 text-xs font-medium sm:text-sm',
                message.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300'
              )}>
                {message.type === 'success' ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            {/* PERFIL */}
            <SectionCard
              icon={User}
              title="Perfil público"
              description="Así te verán los demás en BSWorld."
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Nombre de usuario
                  </label>
                  <div className="group relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary-500" size={16} />
                    <input
                      id="username"
                      type="text"
                      name="username"
                      required
                      maxLength={20}
                      value={formData.username}
                      onChange={handleChange}
                      className={clsx(INPUT_CLASS, 'pl-10')}
                      placeholder="Tu nombre de usuario"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    Máximo 20 caracteres. Se usa en la URL de tu perfil.
                  </p>
                </div>

                <div>
                  <label htmlFor="descripcion" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Descripción
                  </label>
                  <div className="relative">
                    <textarea
                      id="descripcion"
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      placeholder="Cuéntanos algo sobre ti, tus mods o tu estilo..."
                      rows="3"
                      maxLength="200"
                      className={clsx(INPUT_CLASS, 'resize-none pb-6')}
                    />
                    <span className="pointer-events-none absolute bottom-2 right-3 text-[10px] font-medium text-gray-400">
                      {formData.descripcion?.length || 0}/200
                    </span>
                  </div>
                </div>

                {/* AVATAR */}
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Avatar</span>

                  <div className="mb-3 flex w-full gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
                    <button
                      type="button"
                      onClick={() => setAvatarTab('url')}
                      aria-pressed={avatarTab === 'url'}
                      className={clsx(
                        'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all',
                        avatarTab === 'url'
                          ? 'bg-white text-primary-600 shadow-sm dark:bg-[#2a2c31] dark:text-primary-400'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                      )}
                    >
                      <LinkIcon size={13} /> URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarTab('design')}
                      aria-pressed={avatarTab === 'design'}
                      className={clsx(
                        'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all',
                        avatarTab === 'design'
                          ? 'bg-white text-primary-600 shadow-sm dark:bg-[#2a2c31] dark:text-primary-400'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                      )}
                    >
                      <Palette size={13} /> Diseñar
                    </button>
                  </div>

                  {avatarTab === 'url' ? (
                    <div className="group relative">
                      <Camera className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary-500" size={16} />
                      <input
                        type="text"
                        name="avatar"
                        placeholder="https://ejemplo.com/mi-avatar.png"
                        value={isDesignAvatar ? '' : formData.avatar}
                        onChange={handleChange}
                        className={clsx(INPUT_CLASS, 'pl-10')}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/60 p-3 dark:border-white/10 dark:bg-white/[0.03] sm:p-4">
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">1. Icono</p>
                        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
                          {AVATAR_ICON_NAMES.map((name) => {
                            const Icon = AVATAR_ICONS_MAP[name];
                            const selected = selectedIcon === name;
                            return (
                              <button
                                key={name}
                                type="button"
                                onClick={() => updateAvatarDesign(name, selectedColor)}
                                aria-pressed={selected}
                                className={clsx(
                                  'flex aspect-square items-center justify-center rounded-lg border transition-all',
                                  selected
                                    ? 'border-primary-500 bg-primary-50 text-primary-600 shadow-sm dark:border-primary-400 dark:bg-primary-500/15 dark:text-primary-300'
                                    : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-500 dark:hover:text-gray-300'
                                )}
                                title={name}
                              >
                                <Icon size={18} strokeWidth={1.5} />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">2. Color</p>
                        <div className="flex flex-wrap gap-2">
                          {AVATAR_COLORS.map((color) => {
                            const selected = selectedColor === color;
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => updateAvatarDesign(selectedIcon, color)}
                                aria-pressed={selected}
                                aria-label={`Color ${color}`}
                                className={clsx(
                                  'flex h-8 w-8 items-center justify-center rounded-full transition-all',
                                  selected
                                    ? 'scale-110 ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-[#1a1b1e]'
                                    : 'ring-1 ring-black/10 hover:scale-105 dark:ring-white/15'
                                )}
                                style={{ backgroundColor: color }}
                              >
                                {selected && <Check size={14} className="text-white drop-shadow" strokeWidth={3} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* REDES SOCIALES */}
            <SectionCard
              icon={LinkIcon}
              title="Redes sociales"
              description="Enlaces que aparecerán en tu perfil."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SOCIAL_FIELDS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <div key={social.name} className="group">
                      <label htmlFor={social.name} className="mb-1.5 block text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                        {social.label}
                      </label>
                      <div className="relative">
                        <Icon className={clsx('pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors', social.accent)} size={15} />
                        <input
                          id={social.name}
                          type="url"
                          name={social.name}
                          placeholder={social.placeholder}
                          value={formData[social.name]}
                          onChange={handleChange}
                          className={clsx(INPUT_CLASS, 'pl-10')}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* BARRA DE GUARDADO */}
            <div className="sticky bottom-20 z-30 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur-md dark:border-gray-700 dark:bg-[#1c1d20]/95 sm:flex-row sm:items-center sm:justify-between lg:bottom-6">
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className={clsx('h-2 w-2 rounded-full', isDirty ? 'bg-amber-400' : 'bg-emerald-500')} />
                <span className={isDirty ? 'text-amber-700 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'}>
                  {isDirty ? 'Tienes cambios sin guardar' : 'Perfil al día'}
                </span>
              </div>

              <div className="flex gap-2">
                {isDirty && (
                  <button
                    type="button"
                    onClick={resetProfile}
                    disabled={loading}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5 sm:flex-none"
                  >
                    <RotateCcw size={14} />
                    Descartar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || !isDirty}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-primary-600/25 transition-all hover:bg-primary-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none dark:disabled:bg-white/5 dark:disabled:text-gray-600 sm:flex-none"
                >
                  {loading ? <LoadingSpinner variant="inline" size={14} /> : <Save size={14} />}
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </form>

          {/* SEGURIDAD */}
          <SectionCard
            icon={Lock}
            title="Contraseña"
            description="Actualiza la contraseña de tu cuenta."
          >
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordMessage.text && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {passwordMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="new-password" className="mb-1.5 block text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(event) => setPasswordData({ ...passwordData, newPassword: event.target.value })}
                      className={clsx(INPUT_CLASS, 'pl-10 pr-10')}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="mb-1.5 block text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(event) => setPasswordData({ ...passwordData, confirmPassword: event.target.value })}
                      className={clsx(INPUT_CLASS, 'pl-10 pr-10')}
                      placeholder="Repite la contraseña"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {passwordData.newPassword && (
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <span
                        key={level}
                        className={clsx(
                          'h-1 flex-1 rounded-full transition-colors',
                          getPasswordStrength(passwordData.newPassword) >= level
                            ? STRENGTH_META[getPasswordStrength(passwordData.newPassword)].color
                            : 'bg-gray-200 dark:bg-white/10'
                        )}
                      />
                    ))}
                  </div>
                  <span className="w-12 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                    {STRENGTH_META[getPasswordStrength(passwordData.newPassword)].label}
                  </span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-gray-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  {passwordLoading ? <LoadingSpinner variant="inline" size={14} /> : <Shield size={14} />}
                  {passwordLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </div>
            </form>
          </SectionCard>

          {/* ZONA DE PELIGRO */}
          <SectionCard
            icon={AlertCircle}
            title="Zona de peligro"
            description="Acciones irreversibles sobre tu cuenta."
            tone="danger"
          >
            {!showDeleteSection ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Eliminar tu cuenta borrará tu perfil y datos asociados de forma permanente.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteSection(true)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                  Eliminar mi cuenta
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="rounded-xl bg-red-100/60 px-3.5 py-3 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  Esta acción es irreversible. Todos tus datos serán eliminados permanentemente.
                </p>

                <div>
                  <label htmlFor="delete-confirmation" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Escribe <span className="font-black text-red-600 dark:text-red-400">ELIMINAR</span> para confirmar
                  </label>
                  <input
                    id="delete-confirmation"
                    type="text"
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    className={clsx(INPUT_CLASS, 'border-red-200 focus:border-red-500 focus:ring-red-500/20 dark:border-red-900/50')}
                    placeholder="ELIMINAR"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteSection(false);
                      setDeleteConfirmation('');
                    }}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirmation !== 'ELIMINAR'}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteLoading ? <LoadingSpinner variant="inline" size={14} /> : <Trash2 size={14} />}
                    {deleteLoading ? 'Eliminando...' : 'Eliminar cuenta definitivamente'}
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
