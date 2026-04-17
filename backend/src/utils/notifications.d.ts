export declare const createNotification: (userId: number, actorId: number, type: string, referenceId?: number, data?: number) => Promise<void>;
export declare const notifyAllOtherUsers: (actorId: number, type: string, referenceId?: number, data?: number) => Promise<void>;
export declare const checkLevelUp: (userId: number, oldXp: number, newXp: number) => Promise<void>;
export declare const checkRankChange: (userId: number) => Promise<void>;
//# sourceMappingURL=notifications.d.ts.map