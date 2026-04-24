export const calculateLevel = (xp: number): number => {
  // level^2 * 50 = exp  =>  level = sqrt(exp / 50)
  return Math.floor(Math.sqrt(xp / 50));
};

export const XP_REWARDS = {
  // Base rewards
  POST: 5,
  COMMENT: 3,
  MESSAGE: 1,
  SHARE: 2,
  STREAK_BONUS: 5,
  LIKE: 1,

  // Action-Based Multipliers
  ACTION_POST_BONUS: 15,    // Bonus for 'challenge' or 'help' types
  HIGH_VALUE_REACTION: 5,   // Bonus for 'bolt' or 'sparkle'
  HELP_FULFILLMENT: 20      // Reserved for future logic
};

/**
 * Calculates a dynamic reputation score based on XP and total Impact Score.
 * This allows us to have 'Reputation' without adding a new database column.
 */
export const calculateReputation = (xp: number, totalImpactScore: number): number => {
  const xpWeight = 0.4;
  const impactWeight = 0.6;
  return Math.floor((xp * xpWeight) + (totalImpactScore * impactWeight));
};

