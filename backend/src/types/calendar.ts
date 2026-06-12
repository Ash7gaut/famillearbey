export interface CalendarBirthday {
  member_id: string;
  first_name: string;
  last_name: string;
  day: number;
}

export interface CalendarEventCreator {
  id: string;
  first_name: string;
  last_name: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  created_by: string | null;
  creator?: CalendarEventCreator | null;
  days: number[];
  can_manage?: boolean;
}

export interface CalendarAlbum {
  id: string;
  title: string;
  day: number;
  cover_url: string | null;
}

export interface CalendarMonth {
  year: number;
  month: number;
  birthdays: CalendarBirthday[];
  events: CalendarEvent[];
  albums: CalendarAlbum[];
}

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  start_date: string;
  end_date?: string | null;
}
