
ALTER TABLE public.game_settings
  ADD COLUMN card_border_radius INTEGER NOT NULL DEFAULT 16,
  ADD COLUMN card_border_width INTEGER NOT NULL DEFAULT 4,
  ADD COLUMN card_border_color TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN card_back_color TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN card_back_icon TEXT NOT NULL DEFAULT '⭐',
  ADD COLUMN card_shape TEXT NOT NULL DEFAULT 'square';
