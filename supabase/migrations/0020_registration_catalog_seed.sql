-- Bready Calendar — real catalog seed data for the registration wizard.
-- Replaces the tiny hard-coded `mockData` arrays in ServiceContext.jsx with a
-- comprehensive, real-world catalog. Idempotent: ON CONFLICT DO NOTHING keys on
-- the UNIQUE constraints declared in 0019, so re-running never duplicates rows.

BEGIN;

-- ===========================================================================
-- subject_categories
-- ===========================================================================
INSERT INTO public.subject_categories (slug, name, sort_order) VALUES
  ('stem',        'STEM',                          1),
  ('humanities',  'Humanities & Social Studies',   2),
  ('languages',   'Languages',                     3),
  ('business',    'Business & Finance',            4),
  ('arts',        'Creative Arts & Design',        5),
  ('tech',        'Computer Science & Technology', 6),
  ('health',      'Health & Wellness',             7),
  ('test-prep',   'Test Preparation',              8),
  ('music',       'Music & Performing Arts',       9),
  ('life-skills', 'Life Skills',                  10)
ON CONFLICT (slug) DO NOTHING;

-- ===========================================================================
-- subjects
-- ===========================================================================
INSERT INTO public.subjects (name, category_slug, sort_order) VALUES
  -- STEM
  ('Mathematics',          'stem', 1),
  ('Physics',              'stem', 2),
  ('Chemistry',            'stem', 3),
  ('Biology',              'stem', 4),
  ('Statistics',           'stem', 5),
  ('Environmental Science','stem', 6),
  ('Astronomy',            'stem', 7),
  ('Earth Science',        'stem', 8),
  ('Engineering',          'stem', 9),
  -- Humanities & Social Studies
  ('History',              'humanities', 1),
  ('Geography',            'humanities', 2),
  ('Political Science',    'humanities', 3),
  ('Sociology',            'humanities', 4),
  ('Psychology',           'humanities', 5),
  ('Philosophy',           'humanities', 6),
  ('Economics',            'humanities', 7),
  ('Anthropology',         'humanities', 8),
  ('Religious Studies',    'humanities', 9),
  ('Law',                  'humanities', 10),
  -- Languages
  ('English',              'languages', 1),
  ('Spanish',              'languages', 2),
  ('French',               'languages', 3),
  ('German',               'languages', 4),
  ('Mandarin Chinese',     'languages', 5),
  ('Arabic',               'languages', 6),
  ('Hindi',                'languages', 7),
  ('Hebrew',               'languages', 8),
  ('Japanese',             'languages', 9),
  ('Russian',              'languages', 10),
  ('Italian',              'languages', 11),
  ('Portuguese',           'languages', 12),
  -- Business & Finance
  ('Accounting',           'business', 1),
  ('Finance',              'business', 2),
  ('Marketing',            'business', 3),
  ('Management',           'business', 4),
  ('Business Studies',     'business', 5),
  ('Entrepreneurship',     'business', 6),
  -- Creative Arts & Design
  ('Graphic Design',       'arts', 1),
  ('Drawing & Painting',   'arts', 2),
  ('Photography',          'arts', 3),
  ('Creative Writing',     'arts', 4),
  ('Film & Video',         'arts', 5),
  ('Fashion Design',       'arts', 6),
  ('Interior Design',      'arts', 7),
  -- Computer Science & Technology
  ('Computer Science',     'tech', 1),
  ('Programming',          'tech', 2),
  ('Web Development',      'tech', 3),
  ('Data Science',         'tech', 4),
  ('Machine Learning',     'tech', 5),
  ('Cybersecurity',        'tech', 6),
  ('Cloud Computing',      'tech', 7),
  ('Mobile App Development','tech', 8),
  ('Database Management',  'tech', 9),
  -- Health & Wellness
  ('Nutrition',            'health', 1),
  ('Yoga',                 'health', 2),
  ('Fitness Training',     'health', 3),
  ('Mental Health',        'health', 4),
  ('Public Health',        'health', 5),
  ('Anatomy',              'health', 6),
  -- Music & Performing Arts
  ('Music Theory',         'music', 1),
  ('Piano',                'music', 2),
  ('Guitar',               'music', 3),
  ('Violin',               'music', 4),
  ('Vocals & Singing',     'music', 5),
  ('Drums',                'music', 6),
  ('Dance',                'music', 7),
  ('Acting & Drama',       'music', 8),
  -- Life Skills
  ('Public Speaking',      'life-skills', 1),
  ('Study Skills',         'life-skills', 2),
  ('Time Management',      'life-skills', 3),
  ('Chess',                'life-skills', 4),
  ('Cooking',              'life-skills', 5)
ON CONFLICT (name) DO NOTHING;

-- ===========================================================================
-- specializations
-- ===========================================================================
INSERT INTO public.specializations (name, subject_name, sort_order) VALUES
  -- Mathematics
  ('Algebra',                  'Mathematics', 1),
  ('Calculus',                 'Mathematics', 2),
  ('Geometry',                 'Mathematics', 3),
  ('Trigonometry',             'Mathematics', 4),
  ('Statistics & Probability', 'Mathematics', 5),
  ('Linear Algebra',           'Mathematics', 6),
  ('Number Theory',            'Mathematics', 7),
  ('Discrete Mathematics',     'Mathematics', 8),
  -- Physics
  ('Mechanics',                'Physics', 1),
  ('Electromagnetism',         'Physics', 2),
  ('Thermodynamics',           'Physics', 3),
  ('Quantum Physics',          'Physics', 4),
  ('Optics',                   'Physics', 5),
  ('Astrophysics',             'Physics', 6),
  ('Nuclear Physics',          'Physics', 7),
  -- Chemistry
  ('Organic Chemistry',        'Chemistry', 1),
  ('Inorganic Chemistry',      'Chemistry', 2),
  ('Physical Chemistry',       'Chemistry', 3),
  ('Analytical Chemistry',     'Chemistry', 4),
  ('Biochemistry',             'Chemistry', 5),
  -- Biology
  ('Genetics',                 'Biology', 1),
  ('Microbiology',             'Biology', 2),
  ('Botany',                   'Biology', 3),
  ('Zoology',                  'Biology', 4),
  ('Ecology',                  'Biology', 5),
  ('Molecular Biology',        'Biology', 6),
  ('Human Anatomy',            'Biology', 7),
  -- Computer Science
  ('Algorithms',               'Computer Science', 1),
  ('Data Structures',          'Computer Science', 2),
  ('Operating Systems',        'Computer Science', 3),
  ('Computer Networks',        'Computer Science', 4),
  ('Theory of Computation',    'Computer Science', 5),
  -- Programming
  ('Python',                   'Programming', 1),
  ('Java',                     'Programming', 2),
  ('JavaScript',               'Programming', 3),
  ('C++',                      'Programming', 4),
  ('C#',                       'Programming', 5),
  ('Go',                       'Programming', 6),
  ('Rust',                     'Programming', 7),
  -- Web Development
  ('Frontend (React)',         'Web Development', 1),
  ('Backend (Node.js)',        'Web Development', 2),
  ('Full-Stack Development',   'Web Development', 3),
  -- Data Science
  ('Deep Learning',            'Data Science', 1),
  ('Data Visualization',       'Data Science', 2),
  ('Big Data',                 'Data Science', 3),
  ('Natural Language Processing','Data Science', 4),
  -- English
  ('Grammar',                  'English', 1),
  ('Literature',               'English', 2),
  ('Academic Writing',         'English', 3),
  ('Business English',         'English', 4),
  ('Phonics',                  'English', 5),
  -- Economics
  ('Microeconomics',           'Economics', 1),
  ('Macroeconomics',           'Economics', 2),
  ('Econometrics',             'Economics', 3),
  -- History
  ('World History',            'History', 1),
  ('Ancient History',          'History', 2),
  ('Modern History',           'History', 3),
  -- Music Theory
  ('Harmony',                  'Music Theory', 1),
  ('Composition',              'Music Theory', 2),
  ('Sight Reading',            'Music Theory', 3)
ON CONFLICT (name, subject_name) DO NOTHING;

-- ===========================================================================
-- boards
-- ===========================================================================
INSERT INTO public.boards (name, region, sort_order) VALUES
  ('CBSE',                              'India',         1),
  ('ICSE',                              'India',         2),
  ('NCERT',                             'India',         3),
  ('State Board',                       'India',         4),
  ('International Baccalaureate (IB)',  'International',  5),
  ('Cambridge IGCSE',                   'International',  6),
  ('Cambridge A-Levels (CAIE)',         'International',  7),
  ('Edexcel',                           'UK',            8),
  ('AQA',                               'UK',            9),
  ('OCR',                               'UK',           10),
  ('GCSE',                              'UK',           11),
  ('WJEC',                              'UK',           12),
  ('SQA (Scottish Qualifications)',     'UK',           13),
  ('Advanced Placement (AP)',           'USA',          14),
  ('Common Core',                       'USA',          15),
  ('Australian Curriculum (ACARA)',     'Australia',    16),
  ('Ontario Curriculum',                'Canada',       17)
ON CONFLICT (name) DO NOTHING;

-- ===========================================================================
-- exams
-- ===========================================================================
INSERT INTO public.exams (name, region, sort_order) VALUES
  ('JEE Main',                  'India',          1),
  ('JEE Advanced',              'India',          2),
  ('NEET',                      'India',          3),
  ('BITSAT',                    'India',          4),
  ('GATE',                      'India',          5),
  ('CAT',                       'India',          6),
  ('CLAT',                      'India',          7),
  ('UPSC Civil Services',       'India',          8),
  ('NDA',                       'India',          9),
  ('SSC',                       'India',         10),
  ('SAT',                       'USA',           11),
  ('ACT',                       'USA',           12),
  ('PSAT',                      'USA',           13),
  ('GRE',                       'International',  14),
  ('GMAT',                      'International',  15),
  ('LSAT',                      'USA',           16),
  ('MCAT',                      'USA',           17),
  ('USMLE',                     'USA',           18),
  ('IELTS',                     'International',  19),
  ('TOEFL',                     'International',  20),
  ('PTE Academic',              'International',  21),
  ('Duolingo English Test',     'International',  22),
  ('UCAT',                      'UK',            23),
  ('A-Level Exams',             'UK',            24),
  ('AP Exams',                  'USA',           25),
  ('CFA',                       'International',  26),
  ('CPA',                       'International',  27),
  ('Science Olympiad',          'International',  28),
  ('Mathematics Olympiad',      'International',  29)
ON CONFLICT (name) DO NOTHING;

-- ===========================================================================
-- languages
-- ===========================================================================
INSERT INTO public.languages (name, native_name, iso_code, sort_order) VALUES
  ('English',            'English',     'en', 1),
  ('Spanish',            'Español',     'es', 2),
  ('French',             'Français',    'fr', 3),
  ('German',             'Deutsch',     'de', 4),
  ('Italian',            'Italiano',    'it', 5),
  ('Portuguese',         'Português',   'pt', 6),
  ('Mandarin Chinese',   '中文',         'zh', 7),
  ('Cantonese',          '粵語',         'yue', 8),
  ('Japanese',           '日本語',        'ja', 9),
  ('Korean',             '한국어',        'ko', 10),
  ('Arabic',             'العربية',      'ar', 11),
  ('Hindi',              'हिन्दी',        'hi', 12),
  ('Bengali',            'বাংলা',         'bn', 13),
  ('Punjabi',            'ਪੰਜਾਬੀ',        'pa', 14),
  ('Urdu',               'اردو',         'ur', 15),
  ('Tamil',              'தமிழ்',         'ta', 16),
  ('Telugu',             'తెలుగు',        'te', 17),
  ('Marathi',            'मराठी',         'mr', 18),
  ('Gujarati',           'ગુજરાતી',       'gu', 19),
  ('Russian',            'Русский',     'ru', 20),
  ('Ukrainian',          'Українська',  'uk', 21),
  ('Polish',             'Polski',      'pl', 22),
  ('Dutch',              'Nederlands',  'nl', 23),
  ('Swedish',            'Svenska',     'sv', 24),
  ('Norwegian',          'Norsk',       'no', 25),
  ('Danish',             'Dansk',       'da', 26),
  ('Finnish',            'Suomi',       'fi', 27),
  ('Greek',              'Ελληνικά',    'el', 28),
  ('Turkish',            'Türkçe',      'tr', 29),
  ('Hebrew',             'עברית',        'he', 30),
  ('Persian (Farsi)',    'فارسی',        'fa', 31),
  ('Thai',               'ไทย',          'th', 32),
  ('Vietnamese',         'Tiếng Việt',  'vi', 33),
  ('Indonesian',         'Bahasa Indonesia', 'id', 34),
  ('Malay',              'Bahasa Melayu', 'ms', 35),
  ('Filipino (Tagalog)', 'Tagalog',     'tl', 36),
  ('Swahili',            'Kiswahili',   'sw', 37),
  ('Romanian',           'Română',      'ro', 38),
  ('Hungarian',          'Magyar',      'hu', 39),
  ('Czech',              'Čeština',     'cs', 40),
  ('Catalan',            'Català',      'ca', 41)
ON CONFLICT (name) DO NOTHING;

COMMIT;
