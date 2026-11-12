-- ============================================================
-- Migration 006: COMSATS VSPARK Rebranding and Settings Update
-- COMSATS VSPARK — Quiz Competition
-- Aligns database-side branding with the frontend (BRAND_CONFIG).
-- ============================================================

-- Update registration reference generation function to 'VSPARK-'
CREATE OR REPLACE FUNCTION public.generate_registration_ref()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    ref := 'VSPARK-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
           LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    SELECT EXISTS(
      SELECT 1 FROM public.teams WHERE registration_reference = ref
    ) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update Competition Settings to COMSATS VSPARK
UPDATE public.competition_settings
SET value = 'COMSATS VSPARK', updated_at = NOW()
WHERE key = 'competition_name';

UPDATE public.competition_settings
SET value = 'QUIZ COMPETITION', updated_at = NOW()
WHERE key = 'competition_tagline';

UPDATE public.competition_settings
SET value = 'COMSATS VSPARK Quiz Competition is a university-level computing challenge designed to test students'' technical mastery, algorithmic problem-solving, speed, accuracy, and collaborative engineering across seven core computer science subjects.',
    updated_at = NOW()
WHERE key = 'competition_description';

-- Update welcome announcement
UPDATE public.announcements
SET
  title = 'Welcome to COMSATS VSPARK — Quiz Competition',
  body = 'Welcome to COMSATS VSPARK, the COMSATS University Islamabad computing quiz competition challenging students across 7 core computer science subjects through four intense stages. Registration details and schedule updates will be posted here.',
  updated_at = NOW()
WHERE title LIKE '%NEXORA%' OR title LIKE '%Regional Computing Challenge%';