-- ============================================================
-- BSWorld: RLS para comments, likes, forum_posts, forum_likes,
--          notifications y follows.
-- Ejecutar en Supabase Dashboard > SQL Editor (una vez).
-- Requiere haber aplicado content_security_rls.sql (usa is_admin()).
-- No borra datos. Incluye matriz de verificación al final.
-- ============================================================

-- ============================================================
-- 1. COMMENTS (comentarios de mods)
-- UI: solo el autor edita/borra -> policy idéntica.
-- ============================================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comments_read_public ON comments;
DROP POLICY IF EXISTS comments_insert_own ON comments;
DROP POLICY IF EXISTS comments_update_own ON comments;
DROP POLICY IF EXISTS comments_delete_own ON comments;
DROP POLICY IF EXISTS comments_admin_all ON comments;

CREATE POLICY comments_read_public ON comments FOR SELECT USING (true);

CREATE POLICY comments_insert_own ON comments
  FOR INSERT TO authenticated WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY comments_update_own ON comments
  FOR UPDATE TO authenticated
  USING (user_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY comments_delete_own ON comments
  FOR DELETE TO authenticated
  USING (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY comments_admin_all ON comments
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 2. LIKES (likes de mods)
-- NOTA: si existe un trigger que actualiza content.likes_count, debe ser
-- SECURITY DEFINER o el contador fallará para no-dueños. Verificar con:
--   SELECT tgname FROM pg_trigger WHERE tgrelid IN ('likes'::regclass,'comments'::regclass) AND NOT tgisinternal;
-- ============================================================
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS likes_read_public ON likes;
DROP POLICY IF EXISTS likes_write_own ON likes;
DROP POLICY IF EXISTS likes_admin_all ON likes;

CREATE POLICY likes_read_public ON likes FOR SELECT USING (true);

CREATE POLICY likes_write_own ON likes
  FOR INSERT TO authenticated WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY likes_delete_own ON likes
  FOR DELETE TO authenticated USING (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY likes_admin_all ON likes
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 3. FORUM_POSTS (posts y respuestas del foro)
-- UI: autor y admin.
-- ============================================================
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS forum_posts_read_public ON forum_posts;
DROP POLICY IF EXISTS forum_posts_insert_own ON forum_posts;
DROP POLICY IF EXISTS forum_posts_update_own ON forum_posts;
DROP POLICY IF EXISTS forum_posts_delete_own ON forum_posts;
DROP POLICY IF EXISTS forum_posts_admin_all ON forum_posts;

CREATE POLICY forum_posts_read_public ON forum_posts FOR SELECT USING (true);

CREATE POLICY forum_posts_insert_own ON forum_posts
  FOR INSERT TO authenticated WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY forum_posts_update_own ON forum_posts
  FOR UPDATE TO authenticated
  USING (user_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY forum_posts_delete_own ON forum_posts
  FOR DELETE TO authenticated
  USING (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY forum_posts_admin_all ON forum_posts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 4. FORUM_LIKES
-- ============================================================
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS forum_likes_read_public ON forum_likes;
DROP POLICY IF EXISTS forum_likes_write_own ON forum_likes;
DROP POLICY IF EXISTS forum_likes_delete_own ON forum_likes;
DROP POLICY IF EXISTS forum_likes_admin_all ON forum_likes;

CREATE POLICY forum_likes_read_public ON forum_likes FOR SELECT USING (true);

CREATE POLICY forum_likes_write_own ON forum_likes
  FOR INSERT TO authenticated WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY forum_likes_delete_own ON forum_likes
  FOR DELETE TO authenticated USING (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY forum_likes_admin_all ON forum_likes
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 5. NOTIFICATIONS
-- El sistema crea notificaciones PARA otros usuarios (likes, comentarios,
-- revisiones), por eso INSERT lo puede hacer cualquier logueado.
-- Leer/marcar/borrar: solo el dueño o admin.
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_read_own ON notifications;
DROP POLICY IF EXISTS notifications_insert_system ON notifications;
DROP POLICY IF EXISTS notifications_update_own ON notifications;
DROP POLICY IF EXISTS notifications_delete_own ON notifications;
DROP POLICY IF EXISTS notifications_admin_all ON notifications;

CREATE POLICY notifications_read_own ON notifications
  FOR SELECT TO authenticated USING (userid::text = auth.uid()::text OR public.is_admin());

CREATE POLICY notifications_insert_system ON notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE TO authenticated
  USING (userid::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (userid::text = auth.uid()::text OR public.is_admin());

CREATE POLICY notifications_delete_own ON notifications
  FOR DELETE TO authenticated USING (userid::text = auth.uid()::text OR public.is_admin());

CREATE POLICY notifications_admin_all ON notifications
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 6. FOLLOWS
-- ============================================================
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS follows_read_public ON follows;
DROP POLICY IF EXISTS follows_write_own ON follows;
DROP POLICY IF EXISTS follows_delete_own ON follows;
DROP POLICY IF EXISTS follows_admin_all ON follows;

CREATE POLICY follows_read_public ON follows FOR SELECT USING (true);

CREATE POLICY follows_write_own ON follows
  FOR INSERT TO authenticated WITH CHECK (follower_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY follows_delete_own ON follows
  FOR DELETE TO authenticated USING (follower_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY follows_admin_all ON follows
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- MATRIZ DE VERIFICACIÓN
-- 1) Lecturas públicas siguen OK: comentarios, likes, foro cargan en la web.
-- 2) Anónimo crea comentario -> 401 (sin sesión no hay INSERT).
-- 3) Logueado borra comentario ajeno -> 0 filas (solo autor/admin).
-- 4) Notificaciones de otro usuario -> 0 filas.
-- 5) Dar like como logueado -> OK y el contador cambia.
-- 6) Si el contador de likes deja de moverse: hay trigger sin DEFINER,
--    ejecutar el chequeo de la NOTA del apartado 2 y avisar.
-- ============================================================
