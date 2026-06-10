-- ============================================================
-- Supprime la famille exemple + met à jour les frères/sœurs
-- ============================================================

-- Supprimer les membres template (sans tag branche-gautier)
DELETE FROM family_members
WHERE bio NOT LIKE '%[branche-gautier%';

-- Renommer les frères
UPDATE family_members SET first_name = 'Eric',        bio = 'Fils de Pierre & Christiane [branche-gautier-arbey-enfant]' WHERE first_name = 'Frère 5' AND bio LIKE '%[branche-gautier-arbey-enfant]%';

UPDATE family_members SET first_name = 'Jean-Luc',    bio = 'Fils de Pierre & Christiane [branche-gautier-arbey-enfant]' WHERE first_name = 'Frère 1' AND bio LIKE '%[branche-gautier-arbey-enfant]%';
UPDATE family_members SET first_name = 'Jean-Marc',   bio = 'Fils de Pierre & Christiane [branche-gautier-arbey-enfant]' WHERE first_name = 'Frère 2' AND bio LIKE '%[branche-gautier-arbey-enfant]%';
UPDATE family_members SET first_name = 'Jean-Pierre', bio = 'Fils de Pierre & Christiane [branche-gautier-arbey-enfant]' WHERE first_name = 'Frère 3' AND bio LIKE '%[branche-gautier-arbey-enfant]%';
UPDATE family_members SET first_name = 'Jean-Jacques',bio = 'Fils de Pierre & Christiane [branche-gautier-arbey-enfant]' WHERE first_name = 'Frère 4' AND bio LIKE '%[branche-gautier-arbey-enfant]%';

-- Renommer les sœurs
UPDATE family_members SET first_name = 'Anne-Marie', bio = 'Fille de Pierre & Christiane [branche-gautier-arbey-enfant]' WHERE first_name = 'Sœur 1' AND bio LIKE '%[branche-gautier-arbey-enfant]%';
UPDATE family_members SET first_name = 'Christine',  bio = 'Fille de Pierre & Christiane [branche-gautier-arbey-enfant]' WHERE first_name = 'Sœur 2' AND bio LIKE '%[branche-gautier-arbey-enfant]%';
UPDATE family_members SET first_name = 'Zoé',        bio = 'Fille de Pierre & Christiane [branche-gautier-arbey-enfant]' WHERE first_name = 'Sœur 3' AND bio LIKE '%[branche-gautier-arbey-enfant]%';
UPDATE family_members SET first_name = 'Malou',      bio = 'Fille de Pierre & Christiane [branche-gautier-arbey-enfant]' WHERE first_name = 'Sœur 4' AND bio LIKE '%[branche-gautier-arbey-enfant]%';
