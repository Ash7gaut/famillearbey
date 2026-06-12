export type SecretSantaGroupStatus = 'open' | 'drawn';
export type ParticipantStatus = 'invited' | 'accepted' | 'declined';

export interface SecretSantaGroupSummary {
  id: string;
  title: string;
  budget: string | null;
  created_by: string;
  status: SecretSantaGroupStatus;
  drawn_at: string | null;
  created_at: string;
  participant_count: number;
  accepted_count: number;
  is_creator: boolean;
  my_status: ParticipantStatus | null;
}

export interface SecretSantaParticipantView {
  id: string;
  display_name: string;
  status: ParticipantStatus;
  is_creator: boolean;
  is_external: boolean;
  member_id: string | null;
  photo_url: string | null;
}

export interface SecretSantaGroupDetail {
  id: string;
  title: string;
  budget: string | null;
  created_by: string;
  status: SecretSantaGroupStatus;
  drawn_at: string | null;
  created_at: string;
  is_creator: boolean;
  my_participant_id: string | null;
  my_status: ParticipantStatus | null;
  participants: SecretSantaParticipantView[];
}

export interface SecretSantaAssignment {
  receiver_display_name: string;
  participant_names: string[];
  revealed?: boolean;
}

export interface GuestInviteInfo {
  group_title: string;
  budget: string | null;
  guest_display_name: string;
  status: ParticipantStatus;
  group_status: SecretSantaGroupStatus;
}

export interface InviteMemberResult {
  participant: SecretSantaParticipantView;
  email_sent: boolean;
  email_message?: string;
}

export interface InviteEmailResult {
  participant: SecretSantaParticipantView;
  invite_link: string;
  email_sent: boolean;
  email_message?: string;
}
