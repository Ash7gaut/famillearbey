import type { FamilyMember } from './index.js';

export interface AuthSession {
  userId: string;
  email: string;
  member: FamilyMember;
}

export interface AccessRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  message: string | null;
  auth_user_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}
