/**
 * Kinetic AI Logic Engine
 * Handles automated responses and action suggestions.
 */
const AI_PERSONALITY = "Action-Oriented Oracle";
const SUGGESTIONS = [
    {
        type: 'challenge',
        caption: "🚀 UI SPEEDRUN: Redesign the Kinetic login button in 15 minutes. Best design gets a high-value Bolt signal from me! #DesignChallenge",
    },
    {
        type: 'help',
        caption: "❓ ARCHITECTURE HELP: Thinking about switching to Redis for real-time streaks. Anyone built a robust cooldown system before? #DevHelp",
    },
    {
        type: 'challenge',
        caption: "⚡ PRODUCTIVITY SPRINT: List your TOP 3 actions for today. Complete them and earn +50 Reputation. #ActionMatrix",
    },
    {
        type: 'insight',
        caption: "💡 STRATEGY: High-value Bolt (⚡) signals give 2.5x more Impact Score. Use them wisely on original content to boost community quality.",
    }
];
const CHAT_RESPONSES = {
    "hello": ["Hello, Pioneer. Ready to increase your Impact today?", "Greetings. The Action Matrix is waiting for your next move."],
    "xp": ["XP is earned through action. Challenges give the highest rewards (+20 XP).", "Participate in daily quests to maximize your XP gain."],
    "reputation": ["Reputation is your trust score. It grows when others signal your posts with Bolts (⚡) or Sparkles (✨)."],
    "challenge": ["Challenges are the core of Kinetic. They turn social scrolling into productive momentum.", "Try creating a #DesignChallenge to boost your sector influence."],
    "default": [
        "I am analyzing the Action Matrix. How can I help you optimize your contribution?",
        "Every action counts. What challenge are you tackling today?",
        "Impact is earned, not given. Stay Kinetic."
    ]
};
export const getAIResponse = (message) => {
    const lowerMsg = message.toLowerCase();
    for (const key in CHAT_RESPONSES) {
        if (lowerMsg.includes(key)) {
            const options = CHAT_RESPONSES[key];
            if (options && options.length > 0) {
                return options[Math.floor(Math.random() * options.length)] ?? "Stay Kinetic.";
            }
        }
    }
    const defaults = CHAT_RESPONSES.default ?? ["Stay Kinetic."];
    return defaults[Math.floor(Math.random() * defaults.length)] ?? "Stay Kinetic.";
};
export const getAISuggestion = () => {
    return SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
};
//# sourceMappingURL=ai.js.map