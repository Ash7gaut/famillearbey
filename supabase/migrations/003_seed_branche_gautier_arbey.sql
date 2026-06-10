-- ============================================================
-- Branche familiale Gautier / Arbey
-- ============================================================

-- Tag commun pour identifier les enfants de Pierre & Christiane
-- Bio suffix : [branche-gautier-arbey]

-- ── Aînés ──────────────────────────────────────────────────
INSERT INTO family_members (first_name, last_name, birth_date, bio) VALUES
  ('Pierre',     'Arbey', NULL,         'Grand-père — branche Gautier/Arbey [branche-gautier-arbey]'),
  ('Christiane', 'Arbey', '1924-12-02', 'Grand-mère, née le 2 décembre 1924 [branche-gautier-arbey]');

-- ── 10 enfants de Pierre & Christiane ──────────────────────
INSERT INTO family_members (first_name, last_name, birth_date, bio) VALUES
  ('Jean-Luc',    'Arbey', NULL,         'Fils de Pierre & Christiane [branche-gautier-arbey-enfant]'),
  ('Jean-Marc',   'Arbey', NULL,         'Fils de Pierre & Christiane [branche-gautier-arbey-enfant]'),
  ('Jean-Pierre', 'Arbey', NULL,         'Fils de Pierre & Christiane [branche-gautier-arbey-enfant]'),
  ('Jean-Jacques','Arbey', NULL,         'Fils de Pierre & Christiane [branche-gautier-arbey-enfant]'),
  ('Eric',        'Arbey', NULL,         'Fils de Pierre & Christiane [branche-gautier-arbey-enfant]'),
  ('Anne-Marie',  'Arbey', NULL,         'Fille de Pierre & Christiane [branche-gautier-arbey-enfant]'),
  ('Christine',   'Arbey', NULL,         'Fille de Pierre & Christiane [branche-gautier-arbey-enfant]'),
  ('Zoé',         'Arbey', NULL,         'Fille de Pierre & Christiane [branche-gautier-arbey-enfant]'),
  ('Malou',       'Arbey', NULL,         'Fille de Pierre & Christiane [branche-gautier-arbey-enfant]'),
  ('Sybille',     'Arbey', '1970-05-23', 'Mère de Maxence et Antonin [branche-gautier-arbey-enfant]');

-- ── Bernard Gautier ────────────────────────────────────────
INSERT INTO family_members (first_name, last_name, birth_date, bio) VALUES
  ('Bernard', 'Gautier', '1953-03-02', 'Père de Maxence et Antonin [branche-gautier-arbey]');

-- ── Enfants de Sybille & Bernard ───────────────────────────
INSERT INTO family_members (first_name, last_name, birth_date, bio) VALUES
  ('Maxence', 'Gautier', '1999-11-19', 'Fils aîné [branche-gautier-arbey]'),
  ('Antonin', 'Gautier', '2002-04-03', 'Fils cadet [branche-gautier-arbey]');

-- ============================================================
-- RELATIONS
-- ============================================================

-- Pierre & Christiane — conjoints
INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m1.id, m2.id, 'spouse'
FROM family_members m1, family_members m2
WHERE m1.bio LIKE '%[branche-gautier-arbey]%' AND m1.first_name = 'Pierre'
  AND m2.bio LIKE '%[branche-gautier-arbey]%' AND m2.first_name = 'Christiane';

INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m1.id, m2.id, 'spouse'
FROM family_members m1, family_members m2
WHERE m1.bio LIKE '%[branche-gautier-arbey]%' AND m1.first_name = 'Christiane'
  AND m2.bio LIKE '%[branche-gautier-arbey]%' AND m2.first_name = 'Pierre';

-- Pierre & Christiane — parents des 10 enfants
INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT parent.id, child.id, 'parent'
FROM family_members parent, family_members child
WHERE parent.bio LIKE '%[branche-gautier-arbey]%'
  AND parent.first_name IN ('Pierre', 'Christiane')
  AND child.bio LIKE '%[branche-gautier-arbey-enfant]%';

-- Fratrie entre les 10 enfants (toutes les paires)
INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m1.id, m2.id, 'sibling'
FROM family_members m1, family_members m2
WHERE m1.bio LIKE '%[branche-gautier-arbey-enfant]%'
  AND m2.bio LIKE '%[branche-gautier-arbey-enfant]%'
  AND m1.id < m2.id;

INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m2.id, m1.id, 'sibling'
FROM family_members m1, family_members m2
WHERE m1.bio LIKE '%[branche-gautier-arbey-enfant]%'
  AND m2.bio LIKE '%[branche-gautier-arbey-enfant]%'
  AND m1.id < m2.id;

-- Sybille & Bernard — conjoints
INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m1.id, m2.id, 'spouse'
FROM family_members m1, family_members m2
WHERE m1.first_name = 'Sybille' AND m1.bio LIKE '%[branche-gautier-arbey-enfant]%'
  AND m2.first_name = 'Bernard' AND m2.bio LIKE '%[branche-gautier-arbey]%';

INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m1.id, m2.id, 'spouse'
FROM family_members m1, family_members m2
WHERE m1.first_name = 'Bernard' AND m1.bio LIKE '%[branche-gautier-arbey]%'
  AND m2.first_name = 'Sybille' AND m2.bio LIKE '%[branche-gautier-arbey-enfant]%';

-- Sybille & Bernard — parents de Maxence et Antonin
INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT parent.id, child.id, 'parent'
FROM family_members parent, family_members child
WHERE child.first_name IN ('Maxence', 'Antonin')
  AND child.bio LIKE '%[branche-gautier-arbey]%'
  AND (
    (parent.first_name = 'Sybille' AND parent.bio LIKE '%[branche-gautier-arbey-enfant]%')
    OR (parent.first_name = 'Bernard' AND parent.bio LIKE '%[branche-gautier-arbey]%')
  );

-- Maxence & Antonin — frères
INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m1.id, m2.id, 'sibling'
FROM family_members m1, family_members m2
WHERE m1.first_name = 'Maxence' AND m2.first_name = 'Antonin'
  AND m1.bio LIKE '%[branche-gautier-arbey]%'
  AND m2.bio LIKE '%[branche-gautier-arbey]%';

INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m1.id, m2.id, 'sibling'
FROM family_members m1, family_members m2
WHERE m1.first_name = 'Antonin' AND m2.first_name = 'Maxence'
  AND m1.bio LIKE '%[branche-gautier-arbey]%'
  AND m2.bio LIKE '%[branche-gautier-arbey]%';

-- ============================================================
-- ADMINS : Antonin & Maxence
-- (nécessite la migration 002_auth_invites.sql)
-- ============================================================
UPDATE family_members
SET is_admin = TRUE
WHERE first_name IN ('Antonin', 'Maxence')
  AND last_name = 'Gautier'
  AND bio LIKE '%[branche-gautier-arbey]%';
