-- Enable deletion of votes (needed for allowing vote changes)
CREATE POLICY "Anyone can delete votes" 
  ON public.poll_votes FOR DELETE 
  USING (true);
