export type Format = 'CASETE' | 'CD' | 'VINILO' | 'MINIDISC';
export type Envelope = 'kraft' | 'rosa' | 'medianoche' | 'lavanda';
export type ShelfTheme = 'nogal' | 'noche' | 'lavanda';
export type Profile = { id: string; username: string; created_at?: string };
export type Track = { id: string; name: string; artist: string; albumUrl: string | null; externalUrl: string };
export type Artist = { id: string; name: string; imageUrl: string | null; externalUrl: string };
export type MusicProgress = { dailyUnlimited?: boolean; canAddSelf?: boolean; level: number; slots: number; sent: number; pieces: number; extraXP: number; xpToNext: number | null; changesAvailable: number; artists: Artist[]; onboarded: boolean; dailyGiftId: string | null; nextDailyAt: string };
export type Gift = {
  id: string; sender_id: string; receiver_id: string; track_name: string; artist_name: string;
  spotify_image_url: string | null; spotify_track_id?: string | null; spotify_external_url?: string | null;
  format_type: Format; opened: boolean; message: string; created_at: string; origin?: 'friend' | 'daily';
  opened_at?: string | null; deliver_at?: string | null; envelope_type?: Envelope;
  sender?: Profile | null; receiver?: Profile | null;
};
export type GiftDraft = { track: Track; recipient: string; format: Format; envelope: Envelope; message: string; deliverAt: string | null };
export type BackgroundTheme = 'negro' | 'grafito';
export type Preferences = { theme: ShelfTheme; background: BackgroundTheme; haptics: boolean; reducedMotion: boolean };
