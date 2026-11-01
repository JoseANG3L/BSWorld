-- ============================================================
-- BSWorld: protección anti-manipulación de IDs (RLS)
-- Ejecutar en Supabase Dashboard > SQL Editor (una vez).
-- Seguro de aplicar: no borra datos, solo restringe accesos.
-- Después de aplicar, probar matriz de verificación incluida abajo.
-- Rollback: DROP POLICY ... + ALTER TABLE ... DISABLE ROW LEVEL SECURITY
-- ============================================================

-- ---------- 0. Función auxiliar: ¿es admin? ----------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');
$$;

-- ============================================================
-- 1. TABLA content (mods, mapas, etc.)
-- El id de la URL no es prueba: solo dueño o admin escriben.
-- ============================================================
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_read_public ON content;
DROP POLICY IF EXISTS content_read_owner ON content;
DROP POLICY IF EXISTS content_insert_owner ON content;
DROP POLICY IF EXISTS content_write_owner ON content;
DROP POLICY IF EXISTS content_admin_all ON content;

-- Lectura pública: solo aceptado + público (borradores y revisiones NO se filtran)
CREATE POLICY content_read_public ON content
  FOR SELECT USING (estado = 'aceptado' AND visibilidad = 'publico' AND parent_id IS NULL);

-- El dueño ve todo lo suyo (borradores, privados, revisiones)
CREATE POLICY content_read_owner ON content
  FOR SELECT TO authenticated USING (aporte::text = auth.uid()::text);

-- Crear: solo con tu propio id como aporte
CREATE POLICY content_insert_owner ON content
  FOR INSERT TO authenticated WITH CHECK (aporte::text = auth.uid()::text OR public.is_admin());

-- Editar/borrar: solo dueño o admin
CREATE POLICY content_write_owner ON content
  FOR UPDATE TO authenticated USING (aporte::text = auth.uid()::text OR public.is_admin());
CREATE POLICY content_delete_owner ON content
  FOR DELETE TO authenticated USING (aporte::text = auth.uid()::text OR public.is_admin());

-- Admin: acceso total (lectura incluida para el panel)
CREATE POLICY content_admin_all ON content
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Contadores (vistas/descargas) sin abrir UPDATE a todos: RPC con permisos elevados
CREATE OR REPLACE FUNCTION public.register_view(p_content_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE content SET vistas = COALESCE(vistas, 0) + 1 WHERE id::text = p_content_id;
END $$;

CREATE OR REPLACE FUNCTION public.register_download_count(p_content_id text, p_url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cur jsonb;
BEGIN
  SELECT to_jsonb(descargas) INTO cur FROM content WHERE id::text = p_content_id;
  IF cur IS NULL THEN RETURN; END IF;
  UPDATE content
    SET descargas = (
      SELECT jsonb_agg(
        CASE WHEN (e->>'url') = p_url
             THEN e || jsonb_build_object('count', COALESCE((e->>'count')::int, 0) + 1)
             ELSE e END)
      FROM jsonb_array_elements(cur) e)
    WHERE id::text = p_content_id;
END $$;

GRANT EXECUTE ON FUNCTION public.register_view(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_download_count(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ============================================================
-- 2. TABLA users (¡cierra la escalada a admin!)
-- Sin esto, cualquiera con la anon key puede ponerse role='admin'.
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_read_public ON users;
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_admin_all ON users;

-- Perfiles visibles por todos (avatares/nombres en tarjetas)
CREATE POLICY users_read_public ON users FOR SELECT USING (true);

-- Registro: solo tu propia fila
CREATE POLICY users_insert_own ON users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Editar perfil: solo tu fila (el rol lo blinda el trigger de abajo)
CREATE POLICY users_update_own ON users
  FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin());

CREATE POLICY users_admin_all ON users
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Nadie puede auto-asignarse admin (ni siquiera con UPDATE directo por API)
CREATE OR REPLACE FUNCTION public.block_role_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'No tienes permiso para cambiar roles';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'No puedes cambiar el id de usuario';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_block_role_escalation ON users;
CREATE TRIGGER trg_block_role_escalation
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION public.block_role_escalation();

-- ============================================================
-- MATRIZ DE VERIFICACIÓN (ejecutar tras aplicar)
-- 1) Anónimo lee portada: debe devolver filas
--    (con anon key) GET /rest/v1/content?estado=eq.aceptado -> 200 con datos
-- 2) Anónimo edita otro contenido: debe fallar 403/401
--    PATCH /rest/v1/content?id=eq.<uuid-ajeno> -> 0 filas afectadas
-- 3) Usuario cambia su role a admin: debe fallar con 'No tienes permiso'
-- 4) Admin edita cualquier contenido: OK
-- 5) Contador de vistas: SELECT register_view('<uuid>') como anónimo -> OK
-- ============================================================
