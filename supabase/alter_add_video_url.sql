-- Execute este comando no SQL Editor do Supabase para adicionar o suporte a vídeo opcional
ALTER TABLE public.ofertas
ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
