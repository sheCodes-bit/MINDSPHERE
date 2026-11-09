-- ============================================================
-- Migration 003: Seed Data
-- NEXORA — The Regional Computing Challenge
-- ============================================================

-- ============================================================
-- SUBJECTS: 7 Official Competition Subjects
-- ============================================================
INSERT INTO public.subjects (id, name, description, icon, display_order, is_active) VALUES
  (
    'a1b2c3d4-0001-0001-0001-000000000001',
    'Programming Fundamentals',
    'Core programming concepts including variables, data types, control structures, functions, recursion, and basic algorithm design.',
    'code-2',
    1,
    TRUE
  ),
  (
    'a1b2c3d4-0002-0002-0002-000000000002',
    'Object Oriented Programming',
    'OOP principles including classes, objects, inheritance, polymorphism, encapsulation, abstraction, and design patterns.',
    'layers',
    2,
    TRUE
  ),
  (
    'a1b2c3d4-0003-0003-0003-000000000003',
    'Data Structures & Algorithms',
    'Essential data structures (arrays, linked lists, trees, graphs, heaps, hash tables) and algorithms (sorting, searching, dynamic programming, greedy).',
    'git-branch',
    3,
    TRUE
  ),
  (
    'a1b2c3d4-0004-0004-0004-000000000004',
    'Database Systems',
    'Relational database concepts, SQL, normalization, transactions, ACID properties, indexing, query optimization, and NoSQL fundamentals.',
    'database',
    4,
    TRUE
  ),
  (
    'a1b2c3d4-0005-0005-0005-000000000005',
    'Computer Networks',
    'Network models (OSI, TCP/IP), protocols, routing, switching, security fundamentals, DNS, HTTP, and network architecture.',
    'network',
    5,
    TRUE
  ),
  (
    'a1b2c3d4-0006-0006-0006-000000000006',
    'Software Engineering',
    'SDLC models, requirements engineering, software design, testing methodologies, project management, version control, and agile practices.',
    'cpu',
    6,
    TRUE
  ),
  (
    'a1b2c3d4-0007-0007-0007-000000000007',
    'Operating Systems',
    'Process management, memory management, file systems, scheduling algorithms, synchronization, deadlocks, and virtual memory.',
    'server',
    7,
    TRUE
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon        = EXCLUDED.icon,
  display_order = EXCLUDED.display_order;

-- ============================================================
-- ROUNDS: 4 Official Competition Rounds
-- NOTE: UUIDs use the standard 8-4-4-4-12 hex format.
--   Round 1: 00000001-0001-0001-0001-000000000001
--   Round 2: 00000002-0002-0002-0002-000000000002
--   Round 3: 00000003-0003-0003-0003-000000000003
--   Round 4: 00000004-0004-0004-0004-000000000004
-- These are also referenced in the adjudication console.
-- ============================================================
INSERT INTO public.rounds (
  id, round_number, name, round_type, description, is_online,
  questions_per_team, time_limit_seconds, per_question_seconds,
  points_correct, points_incorrect, points_skipped,
  qualification_method, qualification_value, qualification_tie_policy,
  allow_skip, skip_timeout_seconds,
  allow_buzz, wrong_buzz_deduction,
  status
) VALUES
  (
    '00000001-0001-0001-0001-000000000001',
    1,
    'Round 1 — MCQ Screening',
    'mcq_screening',
    'Opening screening round. Each team answers 5 MCQs with 30 seconds per question. No negative marking. Top 80% of teams qualify for Round 2.',
    TRUE,
    5,
    150,
    30,
    1.0,
    0.0,
    0.0,
    'top_percent',
    80.0,
    'include_all',
    FALSE,
    NULL,
    FALSE,
    0.0,
    'draft'
  ),
  (
    '00000002-0002-0002-0002-000000000002',
    2,
    'Round 2 — MCQ Screening',
    'mcq_screening',
    'Second screening round. Each team answers 5 MCQs with 45 seconds per question. No negative marking. Top 4 teams qualify for Round 3.',
    TRUE,
    5,
    225,
    45,
    1.0,
    0.0,
    0.0,
    'top_count',
    4.0,
    'tiebreaker',
    FALSE,
    NULL,
    FALSE,
    0.0,
    'draft'
  ),
  (
    '00000003-0003-0003-0003-000000000003',
    3,
    'Round 3 — Rapid Fire',
    'rapid_fire',
    'Rapid fire physical round. Each team receives 3 minutes total. Questions auto-skip after 3 seconds. Skipped questions are NOT repeated. +1 per correct answer. Top 2 teams proceed to the final.',
    FALSE,
    NULL,
    180,
    NULL,
    1.0,
    0.0,
    0.0,
    'top_count',
    2.0,
    'tiebreaker',
    TRUE,
    3,
    FALSE,
    0.0,
    'draft'
  ),
  (
    '00000004-0004-0004-0004-000000000004',
    4,
    'Round 4 — Buzzer Final',
    'buzzer',
    'Championship buzzer round. First eligible buzzer press gets the opportunity to answer. Correct: +1. Wrong: -0.5. 10 seconds to answer after buzz. Turn passes if unanswered.',
    FALSE,
    NULL,
    NULL,
    10,
    1.0,
    0.5,
    0.0,
    'top_count',
    1.0,
    'tiebreaker',
    FALSE,
    NULL,
    TRUE,
    0.5,
    'draft'
  )
ON CONFLICT (round_number) DO UPDATE SET
  name                   = EXCLUDED.name,
  description            = EXCLUDED.description,
  questions_per_team     = EXCLUDED.questions_per_team,
  time_limit_seconds     = EXCLUDED.time_limit_seconds,
  per_question_seconds   = EXCLUDED.per_question_seconds,
  points_correct         = EXCLUDED.points_correct,
  points_incorrect       = EXCLUDED.points_incorrect,
  qualification_method   = EXCLUDED.qualification_method,
  qualification_value    = EXCLUDED.qualification_value;

-- ============================================================
-- COMPETITION SETTINGS
-- ============================================================
INSERT INTO public.competition_settings (key, value, value_json, description, is_public) VALUES
  ('competition_name',              'NEXORA',                               NULL, 'Official competition name',                          TRUE),
  ('competition_tagline',           'Challenge your knowledge. Prove your intelligence.', NULL, 'Short tagline shown in hero', TRUE),
  ('competition_description',       'NEXORA is a premier regional university computing competition designed to challenge students'' technical mastery, problem-solving speed, and teamwork across seven core computer science subjects.', NULL, 'Full event description', TRUE),
  ('competition_edition',           '2025',                                 NULL, 'Competition year/edition',                          TRUE),
  ('organizer_name',                'Organizer — CONFIGURE ME',             NULL, 'Name of organizing department/institution',         TRUE),
  ('organizer_contact_email',       'organizer@university.edu',             NULL, 'Primary contact email',                             TRUE),
  ('organizer_contact_phone',       NULL,                                   NULL, 'Organizer phone — configure if needed',             FALSE),
  ('event_venue',                   NULL,                                   NULL, 'Physical venue — configure before event',           TRUE),
  ('event_date',                    NULL,                                   NULL, 'ISO 8601 event date — configure before launch',     TRUE),
  ('event_timezone',                'Asia/Karachi',                         NULL, 'IANA timezone for all deadlines and timers',        TRUE),
  ('registration_status',           'closed',                               NULL, 'open | closed | paused',                            TRUE),
  ('registration_open_at',          NULL,                                   NULL, 'ISO 8601 timestamp when registration opens',        TRUE),
  ('registration_close_at',         NULL,                                   NULL, 'ISO 8601 timestamp when registration closes',       TRUE),
  ('max_teams',                     NULL,                                   NULL, 'Maximum number of teams (NULL = unlimited)',         TRUE),
  ('team_min_members',              '2',                                    NULL, 'Minimum team members including captain',            TRUE),
  ('team_max_members',              '3',                                    NULL, 'Maximum team members including captain',            TRUE),
  ('allow_late_registration',       'false',                                NULL, 'Whether late registration is permitted',            FALSE),
  ('require_email_verification',    'true',                                 NULL, 'Require email verification before registration',    FALSE),
  ('round3_time_limit_seconds',     '180',                                  NULL, '3-minute total time per team for Rapid Fire',       FALSE),
  ('round3_skip_timeout_seconds',   '3',                                    NULL, 'Seconds before auto-skip per question',             FALSE),
  ('round1_qualification_percent',  '80',                                   NULL, 'Top X% qualify from Round 1',                       FALSE),
  ('qualification_tie_policy',      'include_all',                          NULL, 'include_all | exclude_all | tiebreaker',            FALSE),
  ('tiebreaker_extra_questions',    '2',                                    NULL, 'Extra questions per tied team in tiebreaker',       FALSE),
  ('developer_name',                'Esha Minahil',                         NULL, 'Developer name for footer credit',                  TRUE),
  ('developer_title',               'Developer',                            NULL, 'Developer title/role',                              TRUE),
  ('developer_linkedin_url',        NULL,                                   NULL, 'Set via NEXT_PUBLIC_DEVELOPER_LINKEDIN_URL env var', TRUE),
  ('leaderboard_published',         'false',                                NULL, 'Whether leaderboard is publicly visible',           TRUE),
  ('results_published',             'false',                                NULL, 'Whether results are publicly visible',              TRUE),
  ('rules_version',                 '1.0',                                  NULL, 'Current rules version for consent tracking',        TRUE)
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description;

-- ============================================================
-- ANNOUNCEMENTS: Welcome Announcement
-- ============================================================
INSERT INTO public.announcements (title, body, status, is_pinned) VALUES
  (
    'Welcome to NEXORA — The Regional Computing Challenge',
    'Welcome to NEXORA, the regional university computing competition challenging students across 7 core computer science subjects through four intense stages. Registration details and schedule updates will be posted here.',
    'published',
    TRUE
  )
ON CONFLICT DO NOTHING;
