import { useState, useEffect } from 'react';
import { Target, Zap, CheckCircle2, Gift, Clock, Lock } from 'lucide-react';
import { showXPToast } from '../components/XPToast';

interface Quest {
    id: string;
    title: string;
    description: string;
    rewardXp: number;
    progress: number;
    target: number;
    isCompleted: boolean;
    isClaimed: boolean;
}

const Quests = () => {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<string | null>(null);

    const fetchQuests = async () => {
        try {
            const res = await fetch('/api/quests/daily', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setQuests(await res.json());
        } catch (e) {
            console.error('Failed to load quests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuests();
    }, []);

    const handleClaim = async (questId: string) => {
        setClaimingId(questId);
        try {
            const res = await fetch(`/api/quests/claim/${questId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                showXPToast(data.rewardXp, 'Quest Reward!');
                setQuests(prev => prev.map(q => q.id === questId ? { ...q, isClaimed: true } : q));
                // Update stats in sidebar if needed (via event)
                window.dispatchEvent(new Event('storage'));
            }
        } catch (e) {
            console.error('Claim failed');
        } finally {
            setClaimingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    const completedNotClaimed = quests.filter(q => q.isCompleted && !q.isClaimed).length;

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3">
                        <Target className="w-8 h-8 text-accent animate-pulse" /> DAILY MISSIONS
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-bold">Protocol: Active | Resets in 24h</p>
                </div>
                <div className="bg-accent/10 border border-accent/20 px-4 py-2 rounded-xl backdrop-blur-md">
                    <div className="text-[10px] text-accent uppercase font-black tracking-tighter">Ready to Claim</div>
                    <div className="text-xl font-black text-white">{completedNotClaimed}</div>
                </div>
            </div>

            <div className="grid gap-4">
                {quests.map((quest) => {
                    const progressPercent = (quest.progress / quest.target) * 100;
                    
                    return (
                        <div key={quest.id} className={`glass-card p-6 relative overflow-hidden transition-all duration-500 ${quest.isClaimed ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                            {/* Glow pattern background */}
                            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full filter blur-3xl opacity-20 ${quest.isCompleted ? 'bg-green-500' : 'bg-primary'}`} />

                            <div className="relative z-10 flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border ${quest.isCompleted ? 'bg-green-500/20 border-green-500/40' : 'bg-white/5 border-white/10'}`}>
                                    {quest.isCompleted ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                                    ) : (
                                        <Clock className="w-6 h-6 text-primary" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-black text-lg tracking-tight uppercase">{quest.title}</h3>
                                        <span className="flex items-center gap-1 text-xs font-black text-accent">
                                            <Zap className="w-3 h-3" /> +{quest.rewardXp} XP
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">{quest.description}</p>

                                    {/* Progress Bar */}
                                    {!quest.isClaimed && (
                                        <>
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter mb-1.5 text-gray-500">
                                                <span>Progress: {quest.progress} / {quest.target}</span>
                                                <span>{Math.floor(progressPercent)}%</span>
                                            </div>
                                            <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${quest.isCompleted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Actions */}
                                    {quest.isCompleted && !quest.isClaimed && (
                                        <button 
                                            onClick={() => handleClaim(quest.id)}
                                            disabled={claimingId === quest.id}
                                            className="mt-5 w-full btn-primary py-2.5 flex items-center justify-center gap-2 font-black uppercase tracking-[0.1em] text-xs group"
                                        >
                                            {claimingId === quest.id ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                                            ) : (
                                                <>
                                                    <Gift className="w-4 h-4 group-hover:bounce" /> Claim Reward
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {quest.isClaimed && (
                                        <div className="mt-4 flex items-center gap-2 text-green-500 font-black uppercase text-[10px] tracking-widest">
                                            <CheckCircle2 className="w-3 h-3" /> Synchronized & Claimed
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Locked Missions Hint */}
            <div className="mt-8 border border-white/5 bg-white/5 rounded-2xl p-6 border-dashed flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-gray-600 group-hover:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest leading-none mb-1">Upcoming Protocols</div>
                    <p className="text-xs text-gray-600 font-medium">Higher rank missions unlock at Level 5.</p>
                </div>
            </div>
        </div>
    );
};

export default Quests;
