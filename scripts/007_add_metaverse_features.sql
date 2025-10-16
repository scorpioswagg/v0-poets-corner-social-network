-- Additional tables for The Poets Corner Metaverse features

-- Games and Activities
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  game_type TEXT NOT NULL, -- 'hangman', 'verse_builder', 'trivia', 'rhyme_race'
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game scores and leaderboards
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  time_taken INTEGER, -- in seconds
  game_data JSONB, -- store game-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Writing prompts and challenges
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_type TEXT NOT NULL, -- 'daily', 'weekly', 'random', 'challenge'
  category TEXT, -- 'poetry', 'fiction', 'non-fiction', 'creative'
  difficulty TEXT DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Prompt responses
CREATE TABLE IF NOT EXISTS public.prompt_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  title TEXT,
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poetry battles/duels
CREATE TABLE IF NOT EXISTS public.poetry_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  theme TEXT,
  challenger_poem_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  challenged_poem_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  votes_challenger INTEGER DEFAULT 0,
  votes_challenged INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Battle votes
CREATE TABLE IF NOT EXISTS public.battle_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES public.poetry_battles(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voted_for_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(battle_id, voter_id)
);

-- Chat channels
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT DEFAULT 'public', -- 'public', 'private', 'group'
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'file', 'system'
  metadata JSONB, -- for attachments, mentions, etc.
  reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery/Showcase for multimedia content
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL, -- 'image', 'video', 'audio', 'text'
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[],
  category TEXT, -- 'poetry', 'art', 'music', 'video'
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery likes
CREATE TABLE IF NOT EXISTS public.gallery_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gallery_item_id UUID NOT NULL REFERENCES public.gallery_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, gallery_item_id)
);

-- Achievements and badges
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- emoji or icon name
  category TEXT, -- 'writing', 'social', 'games', 'community'
  points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- User streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL, -- 'daily_writing', 'daily_login', 'weekly_participation'
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

-- Virtual events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'open_mic', 'workshop', 'contest', 'social'
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER,
  is_public BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event participants
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON public.game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_id ON public.game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON public.game_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_type ON public.prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_prompts_active ON public.prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_responses_prompt_id ON public.prompt_responses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_responses_user_id ON public.prompt_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_poetry_battles_status ON public.poetry_battles(status);
CREATE INDEX IF NOT EXISTS idx_poetry_battles_created_at ON public.poetry_battles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON public.chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_items_user_id ON public.gallery_items(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_created_at ON public.gallery_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- Insert default chat channels
INSERT INTO public.chat_channels (name, description, channel_type, created_by) VALUES
('poetry-corner', 'General poetry discussion and sharing', 'public', (SELECT id FROM auth.users LIMIT 1)),
('art-café', 'Visual arts and creative inspiration', 'public', (SELECT id FROM auth.users LIMIT 1)),
('writers-den', 'Writing tips, techniques, and feedback', 'public', (SELECT id FROM auth.users LIMIT 1)),
('game-lounge', 'Games, challenges, and fun activities', 'public', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, points) VALUES
('First Steps', 'Write your first poem', '🌱', 'writing', 10),
('Verse Master', 'Write 10 poems', '📝', 'writing', 50),
('Creative Soul', 'Write 50 poems', '✨', 'writing', 100),
('Daily Writer', 'Write for 7 consecutive days', '📅', 'writing', 75),
('Game Champ', 'Win 5 poetry games', '🏆', 'games', 60),
('Social Butterfly', 'Comment on 20 posts', '🦋', 'social', 40),
('Community Helper', 'Help 10 other writers', '🤝', 'community', 80),
('Poetry Warrior', 'Win 3 poetry battles', '⚔️', 'games', 90),
('Gallery Curator', 'Share 5 gallery items', '🖼️', 'social', 35),
('Streak Master', 'Maintain a 30-day writing streak', '🔥', 'writing', 150)
ON CONFLICT DO NOTHING;

-- Insert sample games
INSERT INTO public.games (name, description, game_type, difficulty) VALUES
('Poetic Hangman', 'Guess the hidden poetic word or phrase', 'hangman', 'medium'),
('Verse Builder', 'Drag words to form beautiful poetic lines', 'verse_builder', 'easy'),
('Poetry Trivia', 'Test your knowledge of poetry and literature', 'trivia', 'hard'),
('Rhyme Race', 'Find rhyming words as fast as you can', 'rhyme_race', 'medium')
ON CONFLICT DO NOTHING;

-- Insert sample prompts
INSERT INTO public.prompts (title, description, prompt_type, category, difficulty) VALUES
('Morning Dew', 'Write a poem about the first light of day touching morning dew', 'daily', 'poetry', 'easy'),
('Urban Symphony', 'Capture the rhythm and melody of city life in verse', 'weekly', 'poetry', 'medium'),
('Silent Conversations', 'Write about a conversation that never happened', 'random', 'poetry', 'hard'),
('Digital Dreams', 'Explore the intersection of technology and human emotion', 'challenge', 'poetry', 'medium')
ON CONFLICT DO NOTHING;