-- =========================================================================
-- DISCBOXD - SCHEMA FINAL & SECURITY
-- Instruções: Execute este script completo no SQL Editor do seu projeto Supabase.
-- =========================================================================

-- 1. Criação da tabela de Perfis (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  current_track_name text,
  current_track_artist text,
  last_active_at timestamp with time zone,
  bio text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Perfis sao visiveis publicamente.') THEN
      CREATE POLICY "Perfis sao visiveis publicamente." ON profiles FOR SELECT USING ( true );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem inserir seus proprios perfis.') THEN
      CREATE POLICY "Usuarios podem inserir seus proprios perfis." ON profiles FOR INSERT WITH CHECK ( auth.uid() = id );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem atualizar seus proprios perfis.') THEN
      CREATE POLICY "Usuarios podem atualizar seus proprios perfis." ON profiles FOR UPDATE USING ( auth.uid() = id );
    END IF;
END
$$;

-- Função e Gatilho Automatizado para Registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username, avatar_url)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'display_name', 
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    COALESCE(
      new.raw_user_meta_data->>'username',
      'user_' || substr(new.id::text, 1, 8)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Tabela de Coleção
CREATE TABLE IF NOT EXISTS public.collection (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  spotify_id text NOT NULL,
  album_name text NOT NULL,
  artist_name text NOT NULL,
  release_date text,
  artwork_url text,
  genres text[],
  rating numeric(2,1) CHECK (rating >= 0 AND rating <= 5),
  review text,
  favorite_track text,
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, spotify_id)
);

ALTER TABLE public.collection ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Colecoes sao visiveis publicamente.') THEN
      CREATE POLICY "Colecoes sao visiveis publicamente." ON collection FOR SELECT USING ( true );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem inserir na sua propria colecao.') THEN
      CREATE POLICY "Usuarios podem inserir na sua propria colecao." ON collection FOR INSERT WITH CHECK ( auth.uid() = user_id );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem deletar da sua propria colecao.') THEN
      CREATE POLICY "Usuarios podem deletar da sua propria colecao." ON collection FOR DELETE USING ( auth.uid() = user_id );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem atualizar sua propria colecao.') THEN
      CREATE POLICY "Usuarios podem atualizar sua propria colecao." ON collection FOR UPDATE USING ( auth.uid() = user_id );
    END IF;
END
$$;

-- 3. Tabela de Amizades/Seguidores (Follows)
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Seguidores sao visiveis publicamente.') THEN
      CREATE POLICY "Seguidores sao visiveis publicamente." ON follows FOR SELECT USING ( true );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem seguir outras pessoas.') THEN
      CREATE POLICY "Usuarios podem seguir outras pessoas." ON follows FOR INSERT WITH CHECK ( auth.uid() = follower_id );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem deixar de seguir outras pessoas.') THEN
      CREATE POLICY "Usuarios podem deixar de seguir outras pessoas." ON follows FOR DELETE USING ( auth.uid() = follower_id );
    END IF;
END
$$;

-- 4. Tabela de Comentários (Comments)
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid REFERENCES public.collection(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Comentarios sao visiveis publicamente.') THEN
      CREATE POLICY "Comentarios sao visiveis publicamente." ON comments FOR SELECT USING ( true );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem inserir seus comentarios.') THEN
      CREATE POLICY "Usuarios podem inserir seus comentarios." ON comments FOR INSERT WITH CHECK ( auth.uid() = user_id );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem deletar seus comentarios.') THEN
      CREATE POLICY "Usuarios podem deletar seus comentarios." ON comments FOR DELETE USING ( auth.uid() = user_id );
    END IF;
END
$$;

-- 5. Tabela de Curtidas (Likes)
CREATE TABLE IF NOT EXISTS public.likes (
  collection_id uuid REFERENCES public.collection(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (collection_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Curtidas sao visiveis publicamente.') THEN
      CREATE POLICY "Curtidas sao visiveis publicamente." ON likes FOR SELECT USING ( true );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios curtem.') THEN
      CREATE POLICY "Usuarios curtem." ON likes FOR INSERT WITH CHECK ( auth.uid() = user_id );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios descurtem.') THEN
      CREATE POLICY "Usuarios descurtem." ON likes FOR DELETE USING ( auth.uid() = user_id );
    END IF;
END
$$;

-- =========================================================================
-- DISCBOXD - UPDATE SCHEMA PARA ADMIN E MODERAÇÃO
-- =========================================================================

-- 1. Adicionar colunas de controle na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- =========================================================================
-- 2. Atualizar Políticas (RLS) para Administradores
-- Administradores têm poder para atualizar/deletar qualquer coisa.
-- =========================================================================

-- Profiles: Admins podem atualizar qualquer perfil (para banir/mudar bio)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins podem atualizar qualquer perfil.') THEN
      CREATE POLICY "Admins podem atualizar qualquer perfil." ON profiles FOR UPDATE USING ( 
          (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true 
      );
    END IF;
END
$$;

-- Collection: Admins podem deletar qualquer colecao (moderação)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins podem deletar qualquer colecao.') THEN
      CREATE POLICY "Admins podem deletar qualquer colecao." ON collection FOR DELETE USING ( 
          (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true 
      );
    END IF;
END
$$;

-- Comments: Admins podem deletar qualquer comentario (moderação)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins podem deletar qualquer comentario.') THEN
      CREATE POLICY "Admins podem deletar qualquer comentario." ON comments FOR DELETE USING ( 
          (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true 
      );
    END IF;
END
$$;

-- =========================================================================
-- 3. Bloqueios para Usuários Banidos
-- Usuários banidos não podem inserir/atualizar coleções, comentários, etc.
-- Modificando as políticas de INSERT/UPDATE existentes para checar is_banned
-- Nota: Supabase pode não suportar "ALTER POLICY", então dropamos e recriamos.
-- =========================================================================

-- Bloqueio em Collection (INSERT/UPDATE)
DROP POLICY IF EXISTS "Usuarios podem inserir na sua propria colecao." ON collection;
CREATE POLICY "Usuarios podem inserir na sua propria colecao." ON collection FOR INSERT WITH CHECK ( 
    auth.uid() = user_id AND 
    (SELECT is_banned FROM profiles WHERE id = auth.uid()) = false
);

DROP POLICY IF EXISTS "Usuarios podem atualizar sua propria colecao." ON collection;
CREATE POLICY "Usuarios podem atualizar sua propria colecao." ON collection FOR UPDATE USING ( 
    auth.uid() = user_id AND 
    (SELECT is_banned FROM profiles WHERE id = auth.uid()) = false
);

-- Bloqueio em Comments (INSERT)
DROP POLICY IF EXISTS "Usuarios podem inserir seus comentarios." ON comments;
CREATE POLICY "Usuarios podem inserir seus comentarios." ON comments FOR INSERT WITH CHECK ( 
    auth.uid() = user_id AND 
    (SELECT is_banned FROM profiles WHERE id = auth.uid()) = false
);

-- Bloqueio em Likes (INSERT)
DROP POLICY IF EXISTS "Usuarios curtem." ON likes;
CREATE POLICY "Usuarios curtem." ON likes FOR INSERT WITH CHECK ( 
    auth.uid() = user_id AND 
    (SELECT is_banned FROM profiles WHERE id = auth.uid()) = false
);
