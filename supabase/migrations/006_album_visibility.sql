-- Visibilité des albums : toute la famille ou petite famille uniquement

CREATE TYPE album_visibility AS ENUM ('family', 'close_family');

ALTER TABLE albums
  ADD COLUMN visibility album_visibility NOT NULL DEFAULT 'family';

CREATE INDEX idx_albums_visibility ON albums (visibility);

COMMENT ON COLUMN albums.visibility IS
  'family = visible par tous les membres ; close_family = visible uniquement par la petite famille du créateur';
