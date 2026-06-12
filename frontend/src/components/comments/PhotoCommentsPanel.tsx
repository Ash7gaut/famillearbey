import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Trash2 } from 'lucide-react';
import { MemberAvatar } from '../profile/MemberAvatar';
import { memberFullName } from '../profile/memberUtils';
import { useAuthReady } from '../../hooks/useAuthReady';
import { api } from '../../services/api';
import type { PhotoComment } from '../../types/comment';

interface PhotoCommentsPanelProps {
  photoId: string;
}

function formatCommentDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PhotoCommentsPanel({ photoId }: PhotoCommentsPanelProps) {
  const { isAuthenticated } = useAuthReady();
  const [comments, setComments] = useState<PhotoComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PhotoComment[]>(`/comments/photo/${photoId}`);
      setComments(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [photoId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const created = await api.post<PhotoComment>(`/comments/photo/${photoId}`, {
        content: content.trim(),
      });
      setComments((prev) => [...prev, created]);
      setContent('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-t border-cream-300/70 bg-cream-50 sm:w-80 sm:border-l sm:border-t-0 lg:w-96">
      <div className="border-b border-cream-300/60 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-700">
          <MessageCircle className="h-4 w-4 text-ink-500" strokeWidth={2} />
          Commentaires {comments.length > 0 && `(${comments.length})`}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <p className="text-sm text-ink-400">Chargement…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-ink-400">Aucun commentaire pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="group flex gap-2.5">
                <Link to={`/profil/${comment.author.id}`} className="shrink-0">
                  <MemberAvatar member={comment.author} size="sm" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        to={`/profil/${comment.author.id}`}
                        className="text-sm font-medium text-ink-800 hover:text-warm-700"
                      >
                        {memberFullName(comment.author)}
                      </Link>
                      <p className="text-[11px] text-ink-400">{formatCommentDate(comment.created_at)}</p>
                    </div>
                    {comment.can_delete && (
                      <button
                        type="button"
                        onClick={() => void handleDelete(comment.id)}
                        className="focus-ring inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink-700">{comment.content}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-cream-300/60 p-4">
        {isAuthenticated ? (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              placeholder="Ajouter un commentaire…"
              className="input-field resize-none text-sm"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={submitting || !content.trim()} className="btn-primary w-full">
              {submitting ? 'Envoi…' : 'Commenter'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-ink-500">
            <Link to="/login" className="font-medium text-warm-700 hover:underline">
              Connecte-toi
            </Link>{' '}
            pour commenter.
          </p>
        )}
      </div>
    </div>
  );
}
