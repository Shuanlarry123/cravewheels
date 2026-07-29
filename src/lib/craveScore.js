// Crave Score — a composite reputation metric (0-100) that can't be bought.
// Signals & weights:
//   customer ratings (TriedIt reactions / comment stars)  40%
//   repeat orders                                          25%
//   likes                                                  15%
//   comments                                               12%
//   saves                                                   8%
// A restaurant can't pay to inflate these — they only move with real customer behaviour.

const REACTION_VALUE = { loved: 100, good: 80, average: 55, not_worth: 25 };
const WEIGHTS = { rating: 0.4, repeat: 0.25, likes: 0.15, comments: 0.12, saves: 0.08 };
const cap = (v, max) => Math.min(100, (v / max) * 100);

export function computeCraveScore({
  likes = 0,
  comments = 0,
  saves = 0,
  reactions = [],
  commentRatings = [],
  distinctCustomers = 0,
  repeatCustomers = 0,
} = {}) {
  // Customer ratings: prefer "I Tried It" reactions, fall back to comment star ratings.
  let ratingScore = 0;
  if (reactions.length) {
    ratingScore = reactions.reduce((s, r) => s + (REACTION_VALUE[r] ?? 50), 0) / reactions.length;
  } else if (commentRatings.length) {
    ratingScore = (commentRatings.reduce((s, r) => s + r, 0) / commentRatings.length) * 20;
  }

  const repeatScore = distinctCustomers > 0 ? (repeatCustomers / distinctCustomers) * 100 : 0;
  const likeScore = cap(likes, 200);
  const commentScore = cap(comments, 100);
  const saveScore = cap(saves, 100);

  const score = Math.round(
    ratingScore * WEIGHTS.rating +
      repeatScore * WEIGHTS.repeat +
      likeScore * WEIGHTS.likes +
      commentScore * WEIGHTS.comments +
      saveScore * WEIGHTS.saves
  );

  const hasData =
    likes > 0 ||
    comments > 0 ||
    saves > 0 ||
    reactions.length > 0 ||
    commentRatings.length > 0 ||
    distinctCustomers > 0;

  return { score: Math.max(0, Math.min(100, score)), hasData };
}