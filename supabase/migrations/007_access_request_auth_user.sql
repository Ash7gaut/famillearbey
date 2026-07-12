-- Lien vers le compte auth créé lors d'une demande d'accès.
-- Le backend crée le compte auth AVANT d'enregistrer la demande, puis stocke
-- son id ici pour pouvoir lier le profil à l'approbation ou supprimer le
-- compte au rejet. Colonne attendue par authService mais jamais migrée.

ALTER TABLE access_requests
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_access_requests_auth_user ON access_requests (auth_user_id)
  WHERE auth_user_id IS NOT NULL;
