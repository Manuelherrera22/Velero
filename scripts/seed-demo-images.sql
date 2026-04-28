-- Agregar imágenes demo al trip "Atardecer Dorado en el Delta"
-- Pegar en Supabase → SQL Editor → Run

UPDATE trips SET images = ARRAY[
  'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop'
] WHERE id = 'c4ef7c89-e389-47fa-9931-3054c716b2bb';
