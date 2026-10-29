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

export interface Conversation {
  id: string;
  title: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMember {
  conversation_id: string;
  member_id: string;
  added_by: string | null;
  joined_at: string;
  muted: boolean;
  last_read_at: string;
}

export interface ConversationSummary extends Conversation {
  members: FamilyMember[];
  unread_count: number;
  muted: boolean;
  last_message: Message | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  /** null si l'auteur a été supprimé (FK ON DELETE SET NULL). */
  author_id: string | null;
  content: string;
  created_at: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  user_agent?: string;
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
