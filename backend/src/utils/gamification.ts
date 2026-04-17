export const calculateLevel = (xp: number): number => {
  // level^2 * 50 = exp  =>  level = sqrt(exp / 50)
  return Math.floor(Math.sqrt(xp / 50));
};

export const XP_REWARDS = {
  POST: 10,
  COMMENT: 5,
  MESSAGE: 2,
  SHARE: 2,
  STREAK_BONUS: 3,
  LIKE: 1,
};
