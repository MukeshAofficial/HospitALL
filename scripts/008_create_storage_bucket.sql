-- Create storage bucket for medical files
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-files', 'medical-files', true);

-- Create storage policies
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'medical-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view files they have access to" ON storage.objects
FOR SELECT USING (
  bucket_id = 'medical-files' AND (
    -- Users can see their own uploaded files
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Healthcare professionals can see patient files
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'nurse')
    )
  )
);

CREATE POLICY "Users can delete files they uploaded" ON storage.objects
FOR DELETE USING (
  bucket_id = 'medical-files' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'nurse')
    )
  )
);
