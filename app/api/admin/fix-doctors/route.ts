import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Verify the requesting user is an admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    // Extract JWT token from Bearer token
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Check if user is admin and get their hospital_id
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, hospital_id')
      .eq('id', user.id)
      .single()

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (!adminProfile.hospital_id) {
      return NextResponse.json({ error: 'Admin must be associated with a hospital first' }, { status: 400 })
    }

    // Find all doctors and nurses without hospital_id
    const { data: staffWithoutHospital, error: staffError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, email')
      .in('role', ['doctor', 'nurse'])
      .is('hospital_id', null)

    if (staffError) {
      return NextResponse.json({ error: 'Error fetching staff: ' + staffError.message }, { status: 500 })
    }

    if (!staffWithoutHospital || staffWithoutHospital.length === 0) {
      return NextResponse.json({ 
        message: 'No staff members found without hospital assignment',
        updated_count: 0 
      })
    }

    // Update all doctors and nurses to have the admin's hospital_id
    const { data: updatedStaff, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ hospital_id: adminProfile.hospital_id })
      .in('id', staffWithoutHospital.map(staff => staff.id))
      .select('id, full_name, role')

    if (updateError) {
      return NextResponse.json({ error: 'Error updating staff: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully updated ${updatedStaff?.length || 0} staff members with hospital assignment`,
      updated_count: updatedStaff?.length || 0,
      updated_staff: updatedStaff
    })

  } catch (error: any) {
    console.error('Fix doctors error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}