-- Create problems table
CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" 
ON problems
FOR SELECT 
USING (true);

-- Create policy for public insert access
CREATE POLICY "Allow public insert access" 
ON problems
FOR INSERT 
WITH CHECK (true);

-- Set up storage for problem images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('problem_images', 'problem_images', true);

-- Create policy to allow public read access to problem images
CREATE POLICY "Allow public read access to problem images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'problem_images');

-- Create policy to allow public upload access to problem images
CREATE POLICY "Allow public upload access to problem images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'problem_images');
