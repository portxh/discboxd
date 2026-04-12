-- =========================================================================
-- DISCBOXD - SCHEMA FINAL & SECURITY
-- Instruções: Execute este script completo no SQL Editor do seu projeto Supabase.
-- =========================================================================

-- 1. Criação da tabela de Perfis (Profiles)
-- Extensão da tabela de usuários padrão do Supabase Auth para armazenar dados públicos.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativa o Row Level Security (RLS) para garantir segurança
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de Segurança (RLS)

-- Política: Perfis são visíveis para todos os usuários (necessário para o contexto social)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Perfis sao visiveis publicamente.') THEN
      CREATE POLICY "Perfis sao visiveis publicamente." ON profiles FOR SELECT USING ( true );
    END IF;
END
$$;

-- Política: Usuários só podem inserir seu próprio perfil
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem inserir seus proprios perfis.') THEN
      CREATE POLICY "Usuarios podem inserir seus proprios perfis." ON profiles FOR INSERT WITH CHECK ( auth.uid() = id );
    END IF;
END
$$;

-- Política: Usuários só podem atualizar seu próprio perfil
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem atualizar seus proprios perfis.') THEN
      CREATE POLICY "Usuarios podem atualizar seus proprios perfis." ON profiles FOR UPDATE USING ( auth.uid() = id );
    END IF;
END
$$;

-- 3. Função e Gatilho (Trigger) Automatizado para Registro
-- Captura metadados de e-mail ou logins sociais (Spotify/OAuth)

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

-- Garante que o gatilho exista
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Tabela de Coleção (Albums)
-- Tabela para armazenar os álbuns salvos pelos usuários.
CREATE TABLE IF NOT EXISTS public.collection (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  spotify_id text NOT NULL,
  album_name text NOT NULL,
  artist_name text NOT NULL,
  release_date text,
  artwork_url text,
  genres text[],
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, spotify_id)
);

ALTER TABLE public.collection ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem sua própria coleção
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem ver sua propria colecao.') THEN
      CREATE POLICY "Usuarios podem ver sua propria colecao." ON collection FOR SELECT USING ( auth.uid() = user_id );
    END IF;
END
$$;

-- Política: Usuários só podem inserir na sua própria coleção
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem inserir na sua propria colecao.') THEN
      CREATE POLICY "Usuarios podem inserir na sua propria colecao." ON collection FOR INSERT WITH CHECK ( auth.uid() = user_id );
    END IF;
END
$$;

-- Política: Usuários só podem deletar da sua própria coleção
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios podem deletar da sua propria colecao.') THEN
      CREATE POLICY "Usuarios podem deletar da sua propria colecao." ON collection FOR DELETE USING ( auth.uid() = user_id );
    END IF;
END
$$;
