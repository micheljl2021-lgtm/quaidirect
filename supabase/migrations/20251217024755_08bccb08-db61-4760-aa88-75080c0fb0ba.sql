-- Table feedback pour signalements bugs/idées
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'idea')),
  page TEXT NOT NULL,
  description TEXT NOT NULL,
  email TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can read own feedback
CREATE POLICY "Users can read own feedback"
ON public.feedback FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can insert feedback
CREATE POLICY "Users can insert feedback"
ON public.feedback FOR INSERT
WITH CHECK (true);

-- Admin can read all feedback
CREATE POLICY "Admin can read all feedback"
ON public.feedback FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update feedback status
CREATE POLICY "Admin can update feedback"
ON public.feedback FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));