export interface CommentAuthor {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
}

export interface PhotoComment {
  id: string;
  photo_id: string;
  content: string;
  created_at: string;
  author: CommentAuthor;
  can_delete?: boolean;
}

export type PhotoLatestComment = Pick<PhotoComment, 'id' | 'content' | 'created_at' | 'author'>;
