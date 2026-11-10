export type RelationshipType = 'parent' | 'spouse' | 'sibling';

export type BirthDateDisplay = 'day_month' | 'full';

export type Gender = 'male' | 'female';

export interface FamilyMember {
  id: string;
  auth_user_id: string | null;
  invite_email: string | null;
  is_admin: boolean;
  first_name: string;
  last_name: string;
  gender: Gender;
  is_mamie: boolean;
  tribu_id: string | null;
  photo_url: string | null;
  birth_date: string | null;
  birth_date_display: BirthDateDisplay;
  phone: string | null;
  death_date: string | null;
  bio: string | null;
  is_alive: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tribu {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  member_id: string;
  related_member_id: string;
  relationship_type: RelationshipType;
  created_at: string;
}

export interface MemberProfile {
  member: FamilyMember;
  parents: FamilyMember[];
  children: FamilyMember[];
  spouses: FamilyMember[];
  siblings: FamilyMember[];
}

export interface UpdateOwnProfileInput {
  bio?: string | null;
  birth_date?: string | null;
  birth_date_display?: BirthDateDisplay;
  phone?: string | null;
}

export type AlbumVisibility = 'family' | 'close_family';

export interface AlbumCreator {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
}

export interface Album {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  cover_url: string | null;
  visibility: AlbumVisibility;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: AlbumCreator | null;
}

export interface Photo {
  id: string;
  album_id: string;
  uploaded_by: string | null;
  storage_path: string;
  url: string;
  caption: string | null;
  created_at: string;
}

export interface SpouseBranch {
  spouse: FamilyMember;
  children: TreeNode[];
}

export interface TreeNode {
  member: FamilyMember;
  parents: TreeNode[];
  spouses: FamilyMember[];
  spouseBranches: SpouseBranch[];
  children: TreeNode[];
}

export interface WhatsAppGroupRow {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  invite_link: string;
  restricted: boolean;
  pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Groupe tel que renvoyé à un membre AYANT accès (le lien n'est jamais renvoyé sans accès). */
export interface WhatsAppGroup extends WhatsAppGroupRow {
  /** Nombre de membres ayant déclaré « j'y suis déjà ». */
  joined_count: number;
  /** Le membre courant a déclaré être dans le groupe. */
  joined: boolean;
  is_creator: boolean;
  /** Personnes ayant accès (vide si accès « toute la famille »). */
  access_member_ids: string[];
  /** Nombre de signalements « lien cassé » (renvoyé au créateur uniquement, 0 sinon). */
  report_count: number;
  /** Le membre courant a déjà signalé le lien. */
  reported_by_me: boolean;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    message: string;
    code?: string;
  };
}
