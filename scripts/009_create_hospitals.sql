-- Create hospitals table for multi-hospital support
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  admin_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hospitals
CREATE POLICY "hospitals_select_public" ON public.hospitals
  FOR SELECT USING (status = 'active');

CREATE POLICY "hospitals_insert_admin" ON public.hospitals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "hospitals_update_admin_or_owner" ON public.hospitals
  FOR UPDATE USING (
    admin_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "hospitals_delete_admin_only" ON public.hospitals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add hospital_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id);

-- Add hospital_id to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id);

-- Add hospital_id to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id);

-- Update existing RLS policies to include hospital context

-- Update profiles policies
DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON public.profiles;
CREATE POLICY "profiles_select_own_or_staff" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'doctor', 'nurse')
      AND (p.hospital_id = hospital_id OR p.role = 'admin')
    )
  );

-- Update patients policies
DROP POLICY IF EXISTS "patients_select_own_or_staff" ON public.patients;
CREATE POLICY "patients_select_own_or_staff" ON public.patients
  FOR SELECT USING (
    profile_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'doctor', 'nurse')
      AND (p.hospital_id = hospital_id OR p.role = 'admin')
    )
  );

-- Update appointments policies
DROP POLICY IF EXISTS "appointments_select_involved_or_staff" ON public.appointments;
CREATE POLICY "appointments_select_involved_or_staff" ON public.appointments
  FOR SELECT USING (
    doctor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.patients p 
      WHERE p.id = patient_id AND p.profile_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'doctor', 'nurse')
      AND (p.hospital_id = hospital_id OR p.role = 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_hospital_id ON public.profiles(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON public.patients(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appointments_hospital_id ON public.appointments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_status ON public.hospitals(status);