-- ============================================
-- CORRECCIONES PARA SISTEMA DE COMENTARIOS
-- ============================================
-- Ejecutar este script en el SQL Editor de Supabase
-- ============================================

-- 1. AGREGAR CAMPO replies_count A LA TABLA COMMENTS
-- ============================================
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS replies_count INTEGER DEFAULT 0;

-- 2. CREAR FUNCIONES RPC PARA ACTUALIZAR replies_count
-- ============================================

-- Función para incrementar replies_count cuando se crea una respuesta
CREATE OR REPLACE FUNCTION increment_replies_count(parent_comment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE comments 
  SET replies_count = COALESCE(replies_count, 0) + 1 
  WHERE id = parent_comment_id;
END;
$$ LANGUAGE plpgsql;

-- Función para decrementar replies_count cuando se elimina una respuesta
CREATE OR REPLACE FUNCTION decrement_replies_count(parent_comment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE comments 
  SET replies_count = GREATEST(COALESCE(replies_count, 0) - 1, 0) 
  WHERE id = parent_comment_id;
END;
$$ LANGUAGE plpgsql;

-- 3. CREAR TRIGGERS PARA MANTENER replies_count
-- ============================================

-- Trigger para incrementar replies_count cuando se inserta una respuesta
CREATE OR REPLACE FUNCTION handle_reply_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    UPDATE comments 
    SET replies_count = COALESCE(replies_count, 0) + 1 
    WHERE id = NEW.parent_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reply_insert
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION handle_reply_insert();

-- Trigger para decrementar replies_count cuando se elimina una respuesta
CREATE OR REPLACE FUNCTION handle_reply_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.parent_id IS NOT NULL THEN
    UPDATE comments 
    SET replies_count = GREATEST(COALESCE(replies_count, 0) - 1, 0) 
    WHERE id = OLD.parent_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reply_delete
AFTER DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION handle_reply_delete();

-- 4. ACTUALIZAR POLÍTICAS RLS PARA PERMITIR LECTURA PÚBLICA
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view comments" ON comments;

-- Crear política que permite a cualquiera ver comentarios (incluidos no autenticados)
CREATE POLICY "Anyone can view comments"
ON comments FOR SELECT
USING (true);

-- Mantener políticas para crear, actualizar y eliminar (requieren autenticación)
DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments"
ON comments FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
USING (auth.uid() = user_id);

-- 5. ACTUALIZAR CONTADORES EXISTENTES (opcional)
-- ============================================
-- Este paso actualiza los contadores de comentarios existentes
-- Ejecutar solo si hay comentarios previos sin contadores actualizados

UPDATE comments c1
SET replies_count = (
  SELECT COUNT(*)
  FROM comments c2
  WHERE c2.parent_id = c1.id
);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
