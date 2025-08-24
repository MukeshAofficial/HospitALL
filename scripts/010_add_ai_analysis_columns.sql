-- Add AI analysis columns to file_attachments table
ALTER TABLE public.file_attachments 
ADD COLUMN IF NOT EXISTS ai_analysis TEXT,
ADD COLUMN IF NOT EXISTS analysis_type TEXT,
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on AI-analyzed files
CREATE INDEX IF NOT EXISTS idx_file_attachments_ai_analysis ON public.file_attachments(ai_analysis) WHERE ai_analysis IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_attachments_analyzed_at ON public.file_attachments(analyzed_at) WHERE analyzed_at IS NOT NULL;