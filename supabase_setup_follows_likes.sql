-- ============================================
-- SISTEMA DE FOLLOWS Y LIKES PARA BSWORLD
-- ============================================
-- Ejecutar este script en el SQL Editor de Supabase
-- ============================================

-- 1. AGREGAR CAMPOS DE CONTADORES A LA TABLA USERS
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0;

-- 2. AGREGAR CAMPO DE CONTADOR A LA TABLA CONTENT
-- ============================================
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 3. CREAR TABLA DE FOLLOWS (SEGUIDORES/SIGUIENDO)
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created ON follows(created_at DESC);

-- Restricción para evitar auto-follow
ALTER TABLE follows 
ADD CONSTRAINT check_not_self_follow 
CHECK (follower_id != following_id);

-- 4. CREAR TABLA DE LIKES PARA MODS
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_content ON likes(content_id);
CREATE INDEX IF NOT EXISTS idx_likes_created ON likes(created_at DESC);

-- 5. CREAR FUNCIONES RPC PARA ACTUALIZAR CONTADORES
-- ============================================

-- Función para incrementar followers_count
CREATE OR REPLACE FUNCTION increment_followers(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET followers_count = COALESCE(followers_count, 0) + 1 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Función para decrementar followers_count
CREATE OR REPLACE FUNCTION decrement_followers(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0) 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Función para incrementar following_count
CREATE OR REPLACE FUNCTION increment_following(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET following_count = COALESCE(following_count, 0) + 1 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Función para decrementar following_count
CREATE OR REPLACE FUNCTION decrement_following(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0) 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Función para incrementar likes_count en content
CREATE OR REPLACE FUNCTION increment_content_likes(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content 
  SET likes_count = COALESCE(likes_count, 0) + 1 
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Función para decrementar likes_count en content
CREATE OR REPLACE FUNCTION decrement_content_likes(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content 
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) 
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Función para incrementar total_likes en users
CREATE OR REPLACE FUNCTION increment_user_likes(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET total_likes = COALESCE(total_likes, 0) + 1 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Función para decrementar total_likes en users
CREATE OR REPLACE FUNCTION decrement_user_likes(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET total_likes = GREATEST(COALESCE(total_likes, 0) - 1, 0) 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 6. CREAR TRIGGERS PARA MANTENER CONSISTENCIA (OPCIONAL)
-- ============================================

-- Trigger para actualizar followers_count cuando se inserta un follow
CREATE OR REPLACE FUNCTION handle_follow_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET followers_count = COALESCE(followers_count, 0) + 1 
  WHERE id = NEW.following_id;
  
  UPDATE users 
  SET following_count = COALESCE(following_count, 0) + 1 
  WHERE id = NEW.follower_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_follow_insert
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION handle_follow_insert();

-- Trigger para actualizar followers_count cuando se elimina un follow
CREATE OR REPLACE FUNCTION handle_follow_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0) 
  WHERE id = OLD.following_id;
  
  UPDATE users 
  SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0) 
  WHERE id = OLD.follower_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_follow_delete
AFTER DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION handle_follow_delete();

-- Trigger para actualizar likes_count cuando se inserta un like
CREATE OR REPLACE FUNCTION handle_like_insert()
RETURNS TRIGGER AS $$
DECLARE
  creator_id UUID;
BEGIN
  -- Incrementar likes_count del content
  UPDATE content 
  SET likes_count = COALESCE(likes_count, 0) + 1 
  WHERE id = NEW.content_id;
  
  -- Obtener el creador del content
  SELECT aporte->>'uid' INTO creator_id
  FROM content
  WHERE id = NEW.content_id;
  
  -- Incrementar total_likes del creador
  IF creator_id IS NOT NULL THEN
    UPDATE users 
    SET total_likes = COALESCE(total_likes, 0) + 1 
    WHERE id = creator_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_like_insert
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION handle_like_insert();

-- Trigger para actualizar likes_count cuando se elimina un like
CREATE OR REPLACE FUNCTION handle_like_delete()
RETURNS TRIGGER AS $$
DECLARE
  creator_id UUID;
BEGIN
  -- Decrementar likes_count del content
  UPDATE content 
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) 
  WHERE id = OLD.content_id;
  
  -- Obtener el creador del content
  SELECT aporte->>'uid' INTO creator_id
  FROM content
  WHERE id = OLD.content_id;
  
  -- Decrementar total_likes del creador
  IF creator_id IS NOT NULL THEN
    UPDATE users 
    SET total_likes = GREATEST(COALESCE(total_likes, 0) - 1, 0) 
    WHERE id = creator_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_like_delete
AFTER DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION handle_like_delete();

-- 7. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

-- Para tabla follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver follows
CREATE POLICY "Users can view follows"
ON follows FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Política para que los usuarios puedan crear follows
CREATE POLICY "Users can create follows"
ON follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- Política para que los usuarios puedan eliminar sus propios follows
CREATE POLICY "Users can delete own follows"
ON follows FOR DELETE
USING (auth.uid() = follower_id);

-- Para tabla likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver likes
CREATE POLICY "Users can view likes"
ON likes FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Política para que los usuarios puedan crear likes
CREATE POLICY "Users can create likes"
ON likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus propios likes
CREATE POLICY "Users can delete own likes"
ON likes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- SISTEMA DE COMENTARIOS PARA MODS
-- ============================================

-- 8. CREAR TABLA DE COMENTARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- 9. AGREGAR CAMPO DE CONTADOR A LA TABLA CONTENT
-- ============================================
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- 10. CREAR FUNCIONES RPC PARA CONTADOR DE COMENTARIOS
-- ============================================

-- Función para incrementar comments_count
CREATE OR REPLACE FUNCTION increment_content_comments(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content 
  SET comments_count = COALESCE(comments_count, 0) + 1 
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Función para decrementar comments_count
CREATE OR REPLACE FUNCTION decrement_content_comments(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content 
  SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) 
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- 11. CREAR TRIGGERS PARA MANTENER CONSISTENCIA DE COMENTARIOS
-- ============================================

-- Trigger para actualizar comments_count cuando se inserta un comentario
CREATE OR REPLACE FUNCTION handle_comment_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE content 
  SET comments_count = COALESCE(comments_count, 0) + 1 
  WHERE id = NEW.content_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_insert
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION handle_comment_insert();

-- Trigger para actualizar comments_count cuando se elimina un comentario
CREATE OR REPLACE FUNCTION handle_comment_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE content 
  SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) 
  WHERE id = OLD.content_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_delete
AFTER DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION handle_comment_delete();

-- 12. HABILITAR ROW LEVEL SECURITY (RLS) PARA COMENTARIOS
-- ============================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver comentarios
CREATE POLICY "Users can view comments"
ON comments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Política para que los usuarios puedan crear comentarios
CREATE POLICY "Users can create comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus propios comentarios
CREATE POLICY "Users can update own comments"
ON comments FOR UPDATE
USING (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus propios comentarios
CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
