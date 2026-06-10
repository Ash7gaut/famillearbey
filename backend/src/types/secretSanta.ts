export type SecretSantaGroupStatus = 'open' | 'drawn';
export type ParticipantStatus = 'invited' | 'accepted' | 'declined';

export interface SecretSantaGroup {
  id: string;
  title: string;
  budget: string | null;
  created_by: string;
  status: SecretSantaGroupStatus;
  drawn_at: string | null;
  created_at: string;
}

export interface SecretSantaParticipant {
  id: string;
  group_id: string;
  member_id: string | null;
  email: string | null;
  display_name: string;
  invite_token: string | null;
  status: ParticipantStatus;
  is_creator: boolean;
  responded_at: string | null;
  created_at: string;
}

export interface SecretSantaGroupSummary extends SecretSantaGroup {
  participant_count: number;
  accepted_count: number;
  is_creator: boolean;
  my_status: ParticipantStatus | null;
}

export interface SecretSantaGroupDetail extends SecretSantaGroup {
  is_creator: boolean;
  my_participant_id: string | null;
  my_status: ParticipantStatus | null;
  participants: SecretSantaParticipantView[];
}

export interface SecretSantaParticipantView {
  id: string;
  display_name: string;
  status: ParticipantStatus;
  is_creator: boolean;
  is_external: boolean;
  member_id: string | null;
}

export interface SecretSantaAssignment {
  receiver_display_name: string;
  participant_names: string[];
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
