import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated', details: authError }, { status: 401 })
    }

    const results: any = {
      user_id: user.id,
      user_email: user.email,
      checks: {}
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    results.checks.profile = {
      exists: !!profile,
      data: profile,
      error: profileError
    }

    // Check if patient record exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', user.id)
      .maybeSingle()
    
    results.checks.patient = {
      exists: !!patient,
      data: patient,
      error: patientError
    }

    // Check if we can select from patients with join
    const { data: patientWithProfile, error: joinError } = await supabase
      .from('patients')
      .select(`
        *,
        profiles!inner(id, full_name, email, phone)
      `)
      .eq('profile_id', user.id)
      .maybeSingle()
    
    results.checks.patient_with_profile_join = {
      exists: !!patientWithProfile,
      data: patientWithProfile,
      error: joinError
    }

    // Check hospitals if patient has hospital_id
    if (patient?.hospital_id) {
      const { data: hospital, error: hospitalError } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', patient.hospital_id)
        .single()
      
      results.checks.hospital = {
        exists: !!hospital,
        data: hospital,
        error: hospitalError
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}