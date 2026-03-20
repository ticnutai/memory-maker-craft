
-- Create public storage bucket for game images
INSERT INTO storage.buckets (id, name, public) VALUES ('game-images', 'game-images', true);

-- Anyone can view images (public bucket)
CREATE POLICY "Game images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-images');

-- Anyone can upload images (no auth required - kids game)
CREATE POLICY "Anyone can upload game images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'game-images');

-- Anyone can delete their uploaded images
CREATE POLICY "Anyone can delete game images"
ON storage.objects FOR DELETE
USING (bucket_id = 'game-images');
