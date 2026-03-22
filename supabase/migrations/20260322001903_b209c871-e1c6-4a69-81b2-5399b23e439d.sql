ALTER TABLE public.game_settings 
  ADD COLUMN IF NOT EXISTS layout_mode text DEFAULT 'grid',
  ADD COLUMN IF NOT EXISTS snap_to_grid boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS grid_size integer DEFAULT 20,
  ADD COLUMN IF NOT EXISTS card_positions jsonb DEFAULT '[]'::jsonb;