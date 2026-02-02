-- Create table for professional gallery photos
CREATE TABLE public.professional_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for photo likes
CREATE TABLE public.photo_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.professional_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Create table for photo comments
CREATE TABLE public.photo_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.professional_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professional_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for professional_photos
CREATE POLICY "Anyone can view professional photos"
ON public.professional_photos FOR SELECT
USING (true);

CREATE POLICY "Admins can insert professional photos"
ON public.professional_photos FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update professional photos"
ON public.professional_photos FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete professional photos"
ON public.professional_photos FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for photo_likes
CREATE POLICY "Anyone can view photo likes"
ON public.photo_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like photos"
ON public.photo_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their likes"
ON public.photo_likes FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for photo_comments
CREATE POLICY "Anyone can view photo comments"
ON public.photo_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can comment"
ON public.photo_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.photo_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.photo_comments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
ON public.photo_comments FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_professional_photos_professional_id ON public.professional_photos(professional_id);
CREATE INDEX idx_photo_likes_photo_id ON public.photo_likes(photo_id);
CREATE INDEX idx_photo_comments_photo_id ON public.photo_comments(photo_id);

-- Function to get like count for a photo
CREATE OR REPLACE FUNCTION public.get_photo_like_count(p_photo_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.photo_likes
  WHERE photo_id = p_photo_id;
$$;

-- Function to check if user liked a photo
CREATE OR REPLACE FUNCTION public.has_liked_photo(p_photo_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.photo_likes
    WHERE photo_id = p_photo_id
      AND user_id = p_user_id
  );
$$;