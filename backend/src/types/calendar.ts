export interface CalendarBirthday {
  member_id: string;
  first_name: string;
  last_name: string;
  day: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  created_by: string | null;
  days: number[];
  can_manage?: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number;
  birthdays: CalendarBirthday[];
  events: CalendarEvent[];
}

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  start_date: string;
  end_date?: string | null;
}
