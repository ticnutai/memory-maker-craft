
-- Create public storage bucket for game audio
INSERT INTO storage.buckets (id, name, public) VALUES ('game-audio', 'game-audio', true);

CREATE POLICY "Game audio publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-audio');

CREATE POLICY "Anyone can upload game audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'game-audio');

CREATE POLICY "Anyone can delete game audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'game-audio');
