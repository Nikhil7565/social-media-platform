export declare const calculateLevel: (xp: number) => number;
export declare const XP_REWARDS: {
    POST: number;
    COMMENT: number;
    MESSAGE: number;
    SHARE: number;
    STREAK_BONUS: number;
    LIKE: number;
    ACTION_POST_BONUS: number;
    HIGH_VALUE_REACTION: number;
    HELP_FULFILLMENT: number;
};
/**
 * Calculates a dynamic reputation score based on XP and total Impact Score.
 * This allows us to have 'Reputation' without adding a new database column.
 */
export declare const calculateReputation: (xp: number, totalImpactScore: number) => number;
//# sourceMappingURL=gamification.d.ts.map