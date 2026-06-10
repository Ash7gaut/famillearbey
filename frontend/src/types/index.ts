export interface FamilyMember {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  birth_date: string | null;
  death_date: string | null;
  bio: string | null;
  is_alive: boolean;
  created_at: string;
  updated_at: string;
}

export interface TreeNode {
  member: FamilyMember;
  parents: TreeNode[];
  spouses: FamilyMember[];
  children: TreeNode[];
}

export interface Album {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  cover_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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

export interface ApiResponse<T> {
  data: T;
}
