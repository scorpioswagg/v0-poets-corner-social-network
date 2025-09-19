-- Enable Row Level Security on all tables

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "posts_select_published" ON public.posts FOR SELECT USING (is_published = true OR author_id = auth.uid());
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "comments_select_all" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_authenticated" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- Likes policies
CREATE POLICY "likes_select_all" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "favorites_select_own" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Groups policies
CREATE POLICY "groups_select_public" ON public.groups FOR SELECT USING (is_public = true);
CREATE POLICY "groups_insert_authenticated" ON public.groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "groups_update_creator" ON public.groups FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "groups_delete_creator" ON public.groups FOR DELETE USING (auth.uid() = creator_id);

-- Group members policies
CREATE POLICY "group_members_select_all" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "group_members_insert_own" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "group_members_delete_own" ON public.group_members FOR DELETE USING (auth.uid() = user_id);

-- Contests policies
CREATE POLICY "contests_select_all" ON public.contests FOR SELECT USING (true);
CREATE POLICY "contests_insert_authenticated" ON public.contests FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "contests_update_creator" ON public.contests FOR UPDATE USING (auth.uid() = creator_id);

-- Contest submissions policies
CREATE POLICY "contest_submissions_select_all" ON public.contest_submissions FOR SELECT USING (true);
CREATE POLICY "contest_submissions_insert_own" ON public.contest_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contest_submissions_delete_own" ON public.contest_submissions FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "messages_select_own" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update_recipient" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);

-- Reports policies
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "reports_insert_authenticated" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
