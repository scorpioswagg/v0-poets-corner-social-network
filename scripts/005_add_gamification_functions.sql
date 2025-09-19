-- Functions for gamification system

-- Function to award badges based on achievements
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  user_posts_count INTEGER;
  user_likes_count INTEGER;
  user_comments_count INTEGER;
  current_badges TEXT[];
BEGIN
  -- Get current user stats
  SELECT COUNT(*) INTO user_posts_count 
  FROM public.posts 
  WHERE author_id = NEW.author_id AND is_published = true;
  
  SELECT COALESCE(SUM(likes_count), 0) INTO user_likes_count 
  FROM public.posts 
  WHERE author_id = NEW.author_id AND is_published = true;
  
  SELECT COUNT(*) INTO user_comments_count 
  FROM public.comments 
  WHERE author_id = NEW.author_id;
  
  -- Get current badges
  SELECT COALESCE(badges, ARRAY[]::TEXT[]) INTO current_badges 
  FROM public.profiles 
  WHERE id = NEW.author_id;
  
  -- Award "First Post" badge
  IF user_posts_count = 1 AND NOT 'First Post' = ANY(current_badges) THEN
    UPDATE public.profiles 
    SET badges = array_append(badges, 'First Post')
    WHERE id = NEW.author_id;
  END IF;
  
  -- Award "Prolific Writer" badge (10+ posts)
  IF user_posts_count >= 10 AND NOT 'Prolific Writer' = ANY(current_badges) THEN
    UPDATE public.profiles 
    SET badges = array_append(badges, 'Prolific Writer')
    WHERE id = NEW.author_id;
  END IF;
  
  -- Award "Popular Poet" badge (100+ total likes)
  IF user_likes_count >= 100 AND NOT 'Popular Poet' = ANY(current_badges) THEN
    UPDATE public.profiles 
    SET badges = array_append(badges, 'Popular Poet')
    WHERE id = NEW.author_id;
  END IF;
  
  -- Award "Rising Star" badge (50+ total likes)
  IF user_likes_count >= 50 AND user_likes_count < 100 AND NOT 'Rising Star' = ANY(current_badges) THEN
    UPDATE public.profiles 
    SET badges = array_append(badges, 'Rising Star')
    WHERE id = NEW.author_id;
  END IF;
  
  -- Award "Conversation Starter" badge (50+ comments made)
  IF user_comments_count >= 50 AND NOT 'Conversation Starter' = ANY(current_badges) THEN
    UPDATE public.profiles 
    SET badges = array_append(badges, 'Conversation Starter')
    WHERE id = NEW.author_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to check badges when posts are published
CREATE TRIGGER check_badges_on_post
  AFTER INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  WHEN (NEW.is_published = true)
  EXECUTE FUNCTION public.check_and_award_badges();

-- Function to get leaderboard data
CREATE OR REPLACE FUNCTION public.get_leaderboard_stats()
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  points INTEGER,
  badges TEXT[],
  posts_count BIGINT,
  likes_received BIGINT,
  comments_made BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.points,
    p.badges,
    COALESCE(post_stats.posts_count, 0) as posts_count,
    COALESCE(post_stats.likes_received, 0) as likes_received,
    COALESCE(comment_stats.comments_made, 0) as comments_made
  FROM public.profiles p
  LEFT JOIN (
    SELECT 
      author_id,
      COUNT(*) as posts_count,
      SUM(likes_count) as likes_received
    FROM public.posts 
    WHERE is_published = true 
    GROUP BY author_id
  ) post_stats ON p.id = post_stats.author_id
  LEFT JOIN (
    SELECT 
      author_id,
      COUNT(*) as comments_made
    FROM public.comments 
    GROUP BY author_id
  ) comment_stats ON p.id = comment_stats.author_id
  ORDER BY p.points DESC;
END;
$$;

-- Function to get contest leaderboard
CREATE OR REPLACE FUNCTION public.get_contest_leaderboard(contest_uuid UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  post_id UUID,
  post_title TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.user_id,
    pr.username,
    pr.display_name,
    pr.avatar_url,
    cs.post_id,
    po.title as post_title,
    po.likes_count,
    po.comments_count,
    cs.submitted_at
  FROM public.contest_submissions cs
  JOIN public.profiles pr ON cs.user_id = pr.id
  JOIN public.posts po ON cs.post_id = po.id
  WHERE cs.contest_id = contest_uuid
  ORDER BY po.likes_count DESC, cs.submitted_at ASC;
END;
$$;
