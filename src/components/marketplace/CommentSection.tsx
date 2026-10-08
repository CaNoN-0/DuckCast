import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Send, Reply, CornerDownRight } from 'lucide-react';
import { MarketComment, MarketCommentReply } from '../../types/market';

interface CommentSectionProps {
  initialComments?: MarketComment[];
  marketId: string;
}

export function CommentSection({ initialComments = [], marketId }: CommentSectionProps) {
  const [filter, setFilter] = useState<'Top' | 'Newest'>('Top');
  const [comments, setComments] = useState<MarketComment[]>(initialComments);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentPosition, setNewCommentPosition] = useState<'YES' | 'NO'>('YES');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Handle Like on Comment
  const handleToggleLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const userLiked = !c.userLiked;
          return {
            ...c,
            userLiked,
            likes: userLiked ? c.likes + 1 : Math.max(0, c.likes - 1)
          };
        }
        return c;
      })
    );
  };

  // Handle Like on Reply
  const handleToggleReplyLike = (commentId: string, replyId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: c.replies.map((r) => {
              if (r.id === replyId) {
                const userLiked = !r.userLiked;
                return {
                  ...r,
                  userLiked,
                  likes: userLiked ? r.likes + 1 : Math.max(0, r.likes - 1)
                };
              }
              return r;
            })
          };
        }
        return c;
      })
    );
  };

  // Post New Comment
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: MarketComment = {
      id: `c-${Date.now()}`,
      author: 'You (Forecaster0x)',
      handle: '@duck_trader',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
      position: newCommentPosition,
      staked: '$100',
      text: newCommentText.trim(),
      timestamp: 'Just now',
      likes: 1,
      userLiked: true,
      replies: []
    };

    setComments([newComment, ...comments]);
    setNewCommentText('');
  };

  // Post Reply
  const handlePostReply = (commentId: string) => {
    if (!replyText.trim()) return;

    const newReply: MarketCommentReply = {
      id: `r-${Date.now()}`,
      author: 'You (Forecaster0x)',
      handle: '@duck_trader',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
      text: replyText.trim(),
      timestamp: 'Just now',
      likes: 0
    };

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [...c.replies, newReply]
          };
        }
        return c;
      })
    );

    setReplyingToId(null);
    setReplyText('');
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (filter === 'Top') return b.likes - a.likes;
    return 0; // default order is newest
  });

  return (
    <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
      {/* Header with Top / Newest tabs */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-neutral-500" />
          <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
            Discussion ({comments.length})
          </h3>
        </div>

        {/* Filter Tabs: Top vs Newest */}
        <div className="inline-flex items-center p-1 bg-neutral-100 rounded-full text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilter('Top')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              filter === 'Top' ? 'bg-white text-[#09090B] shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Top
          </button>
          <button
            type="button"
            onClick={() => setFilter('Newest')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              filter === 'Newest' ? 'bg-white text-[#09090B] shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Newest
          </button>
        </div>
      </div>

      {/* New Comment Input Form */}
      <form onSubmit={handlePostComment} className="mb-5 p-3 bg-neutral-50 rounded-xl border border-neutral-200/70">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-700">Predicting with thesis:</span>
            <div className="inline-flex p-0.5 bg-neutral-200/70 rounded-full text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setNewCommentPosition('YES')}
                className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                  newCommentPosition === 'YES' ? 'bg-emerald-600 text-white' : 'text-neutral-600'
                }`}
              >
                YES
              </button>
              <button
                type="button"
                onClick={() => setNewCommentPosition('NO')}
                className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                  newCommentPosition === 'NO' ? 'bg-rose-600 text-white' : 'text-neutral-600'
                }`}
              >
                NO
              </button>
            </div>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono-tabular">Markdown supported</span>
        </div>

        <textarea
          rows={2}
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Share your prediction rationale, data sources, or counter-arguments..."
          className="w-full p-2.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500 resize-none font-medium"
        />

        <div className="flex items-center justify-end mt-2">
          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#09090B] hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-40"
          >
            <Send className="w-3 h-3" />
            <span>Post Comment</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {sortedComments.map((comment) => (
          <div key={comment.id} className="p-3 bg-neutral-50/50 rounded-xl border border-neutral-200/60">
            {/* Author info */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <img
                  src={comment.avatar}
                  alt={comment.author}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#09090B]">{comment.author}</span>
                    <span className="text-[11px] text-neutral-400 font-mono-tabular">{comment.handle}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {comment.position && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      comment.position === 'YES'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Holding {comment.position}
                  </span>
                )}
                <span className="text-[11px] text-neutral-400 font-mono-tabular">{comment.timestamp}</span>
              </div>
            </div>

            {/* Comment Text */}
            <p className="text-xs text-neutral-700 leading-relaxed mb-2.5 font-medium">
              {comment.text}
            </p>

            {/* Action buttons (Like, Reply) */}
            <div className="flex items-center gap-4 text-xs font-semibold text-neutral-500 pt-1.5 border-t border-neutral-200/50">
              <button
                type="button"
                onClick={() => handleToggleLike(comment.id)}
                className={`inline-flex items-center gap-1 cursor-pointer transition-colors ${
                  comment.userLiked ? 'text-emerald-700 font-bold' : 'hover:text-[#09090B]'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${comment.userLiked ? 'fill-emerald-600' : ''}`} />
                <span>{comment.likes}</span>
              </button>

              <button
                type="button"
                onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                className="inline-flex items-center gap-1 hover:text-[#09090B] cursor-pointer"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            </div>

            {/* Reply Input Box */}
            {replyingToId === comment.id && (
              <div className="mt-3 pl-4 pt-2 border-l-2 border-neutral-200 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Replying to ${comment.author}...`}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handlePostReply(comment.id)}
                  disabled={!replyText.trim()}
                  className="px-3 py-1.5 bg-[#09090B] text-white text-xs font-bold rounded-lg hover:bg-neutral-800 disabled:opacity-40 cursor-pointer"
                >
                  Reply
                </button>
              </div>
            )}

            {/* Render Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 pl-4 space-y-2 border-l-2 border-neutral-200/70">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="bg-white p-2.5 rounded-lg border border-neutral-200/60 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <img src={reply.avatar} alt={reply.author} className="w-4 h-4 rounded-full" />
                        <span className="font-bold text-[#09090B]">{reply.author}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono-tabular">{reply.timestamp}</span>
                    </div>
                    <p className="text-neutral-700 mb-1.5">{reply.text}</p>
                    <button
                      type="button"
                      onClick={() => handleToggleReplyLike(comment.id, reply.id)}
                      className={`inline-flex items-center gap-1 text-[11px] cursor-pointer ${
                        reply.userLiked ? 'text-emerald-700 font-bold' : 'text-neutral-400 hover:text-neutral-700'
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${reply.userLiked ? 'fill-emerald-600' : ''}`} />
                      <span>{reply.likes}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
