-- Create medical records table
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('consultation', 'diagnosis', 'treatment', 'prescription', 'lab_result', 'imaging')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  diagnosis_codes TEXT[],
  medications JSONB,
  lab_results JSONB,
  vital_signs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical records
CREATE POLICY "medical_records_select_involved_or_staff" ON public.medical_records
  FOR SELECT USING (
    doctor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.patients p 
      WHERE p.id = patient_id AND p.profile_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'nurse')
    )
  );

CREATE POLICY "medical_records_insert_staff_only" ON public.medical_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'nurse')
    )
  );

CREATE POLICY "medical_records_update_doctor_or_admin" ON public.medical_records
  FOR UPDATE USING (
    doctor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "medical_records_delete_admin_only" ON public.medical_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
