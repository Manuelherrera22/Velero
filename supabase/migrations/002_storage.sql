-- ============================================
-- VELERO PLATFORM — Storage Buckets
-- Run this AFTER the main migration
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('trip-images', 'trip-images', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('boat-images', 'boat-images', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage Policies — Trip Images
CREATE POLICY "Trip images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'trip-images');

CREATE POLICY "Authenticated users can upload trip images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'trip-images' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own trip images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'trip-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own trip images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'trip-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage Policies — Boat Images
CREATE POLICY "Boat images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'boat-images');

CREATE POLICY "Authenticated users can upload boat images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'boat-images' AND auth.role() = 'authenticated'
  );

-- Storage Policies — Avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );
