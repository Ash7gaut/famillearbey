-- Retire les tags techniques [branche-*] des bios membres (seed généalogique)
UPDATE family_members
SET bio = NULLIF(
  TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(bio, '\s*\[branche[-a-z0-9]+\]', '', 'gi'),
      '\s+',
      ' ',
      'g'
    )
  ),
  ''
)
WHERE bio IS NOT NULL
  AND bio ~* '\[branche-';
