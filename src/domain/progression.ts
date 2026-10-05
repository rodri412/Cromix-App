import type { Artist, Gift, MusicProgress } from './types';
export function progressFromGifts(gifts: Gift[], userId: string, artists: Artist[] = [], changesUsed = 0): MusicProgress {
  const sent = gifts.filter(gift => gift.sender_id === userId && gift.receiver_id !== userId && gift.origin !== 'daily').length;
  const pieces = gifts.filter(gift => gift.receiver_id === userId && gift.opened).length;
  const achievements = Number(sent >= 3) + Number(pieces >= 10);
  const extraXP = Math.max(sent - 3, 0) * 5 + Math.max(pieces - 10, 0) * 2;
  const level = 1 + achievements + (achievements === 2 ? Math.floor(extraXP / 100) : 0);
  const tomorrow = new Date(); tomorrow.setUTCHours(24, 0, 0, 0);
  return { level, slots: Math.min(5, 3 + achievements), sent, pieces, extraXP, xpToNext: achievements === 2 ? 100 - extraXP % 100 : null, changesAvailable: Math.max(level - 3 - changesUsed, 0), artists, onboarded: artists.length >= 3, dailyGiftId: gifts.find(gift => gift.origin === 'daily' && gift.created_at.slice(0,10) === new Date().toISOString().slice(0,10))?.id ?? null, nextDailyAt: tomorrow.toISOString() };
}
