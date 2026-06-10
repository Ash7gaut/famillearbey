-- ============================================================
-- Ajoute Eric — 5ème frère
-- ============================================================

INSERT INTO family_members (first_name, last_name, birth_date, bio)
SELECT 'Eric', 'Arbey', NULL, 'Fils de Pierre & Christiane [branche-gautier-arbey-enfant]'
WHERE NOT EXISTS (
  SELECT 1 FROM family_members
  WHERE first_name = 'Eric' AND bio LIKE '%[branche-gautier-arbey-enfant]%'
);

-- Pierre & Christiane — parents d'Eric
INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT parent.id, child.id, 'parent'
FROM family_members parent, family_members child
WHERE parent.bio LIKE '%[branche-gautier-arbey]%'
  AND parent.first_name IN ('Pierre', 'Christiane')
  AND child.first_name = 'Eric'
  AND child.bio LIKE '%[branche-gautier-arbey-enfant]%'
ON CONFLICT (member_id, related_member_id, relationship_type) DO NOTHING;

-- Fratrie : Eric avec tous ses frères et sœurs
INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m1.id, m2.id, 'sibling'
FROM family_members m1, family_members m2
WHERE m1.first_name = 'Eric' AND m1.bio LIKE '%[branche-gautier-arbey-enfant]%'
  AND m2.bio LIKE '%[branche-gautier-arbey-enfant]%'
  AND m2.first_name != 'Eric'
  AND m1.id < m2.id
ON CONFLICT (member_id, related_member_id, relationship_type) DO NOTHING;

INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m2.id, m1.id, 'sibling'
FROM family_members m1, family_members m2
WHERE m1.first_name = 'Eric' AND m1.bio LIKE '%[branche-gautier-arbey-enfant]%'
  AND m2.bio LIKE '%[branche-gautier-arbey-enfant]%'
  AND m2.first_name != 'Eric'
  AND m1.id < m2.id
ON CONFLICT (member_id, related_member_id, relationship_type) DO NOTHING;
