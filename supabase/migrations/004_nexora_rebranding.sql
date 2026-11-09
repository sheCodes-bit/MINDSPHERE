-- ============================================================
-- Migration 004: NEXORA Rebranding and Settings Update
-- NEXORA — The Regional Computing Challenge
-- ============================================================

-- Update registration reference generation function to 'NEX-'
CREATE OR REPLACE FUNCTION public.generate_registration_ref()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    ref := 'NEX-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
           LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    SELECT EXISTS(
      SELECT 1 FROM public.teams WHERE registration_reference = ref
    ) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update Competition Settings to NEXORA
UPDATE public.competition_settings
SET value = 'NEXORA', updated_at = NOW()
WHERE key = 'competition_name';

UPDATE public.competition_settings
SET value = 'THE REGIONAL COMPUTING CHALLENGE', updated_at = NOW()
WHERE key = 'competition_tagline';

UPDATE public.competition_settings
SET value = 'NEXORA is a premier regional university computing competition designed to challenge students'' technical mastery, problem-solving speed, and teamwork across seven core computer science subjects.',
    updated_at = NOW()
WHERE key = 'competition_description';

-- Seed Additional Developer Credits for NEXORA
INSERT INTO public.competition_settings (key, value, description, is_public) VALUES
  ('developer_esha_name', 'Esha Minahil', 'First lead developer name', TRUE),
  ('developer_esha_reg', 'SP24-BSE-010', 'First lead developer registration ID', TRUE),
  ('developer_esha_title', 'Developer', 'First lead developer title', TRUE),
  ('developer_seerat_name', 'Seerat Rauf', 'Second lead developer name', TRUE),
  ('developer_seerat_reg', 'SP24-BSE-027', 'Second lead developer registration ID', TRUE),
  ('developer_seerat_title', 'Developer', 'Second lead developer title', TRUE),
  ('developer_seerat_linkedin_url', NULL, 'Configured via NEXT_PUBLIC_DEVELOPER_SEERAT_LINKEDIN_URL', TRUE)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;

-- Update welcome announcement
UPDATE public.announcements
SET
  title = 'Welcome to NEXORA — The Regional Computing Challenge',
  body = 'Welcome to NEXORA, the regional university computing competition challenging students across 7 core computer science subjects through four intense stages. Registration details and schedule updates will be posted here.',
  updated_at = NOW()
WHERE title LIKE '%Battle of Brains%';
