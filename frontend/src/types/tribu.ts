export interface TribuMemberSummary {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  is_chef: boolean;
}

export interface Tribu {
  id: string;
  label: string | null;
  chef_member_id: string;
  created_at: string;
  updated_at: string;
}

export interface TribuWithMembers extends Tribu {
  members: TribuMemberSummary[];
  can_manage?: boolean;
}
