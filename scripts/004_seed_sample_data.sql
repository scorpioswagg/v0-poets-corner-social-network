-- Sample data for The Poets Corner

-- Insert sample groups/communities
INSERT INTO public.groups (id, name, description, theme, creator_id, is_public) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Romantic Poetry', 'A space for love poems and romantic verses', 'romantic', '550e8400-e29b-41d4-a716-446655440000', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Slam Poetry', 'High-energy spoken word and performance poetry', 'slam', '550e8400-e29b-41d4-a716-446655440000', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Haiku Masters', 'Traditional and modern haiku poetry', 'haiku', '550e8400-e29b-41d4-a716-446655440000', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'Political Voices', 'Poetry that speaks truth to power', 'political', '550e8400-e29b-41d4-a716-446655440000', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'Experimental Forms', 'Push the boundaries of traditional poetry', 'experimental', '550e8400-e29b-41d4-a716-446655440000', true);

-- Insert sample contest
INSERT INTO public.contests (id, title, description, theme, start_date, end_date, creator_id, is_active, prize_description) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'Winter Solstice Poetry Challenge', 'Write a poem capturing the essence of winter and the longest night', 'winter', NOW(), NOW() + INTERVAL '30 days', '550e8400-e29b-41d4-a716-446655440000', true, 'Featured on homepage and special badge');
