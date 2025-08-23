import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase client with service role
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
    // Verify the requesting user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Get current admin profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, hospital_id, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'User is not an admin' }, { status: 403 })
    }

    // If admin already has a hospital_id, return it
    if (profile.hospital_id) {
      const { data: hospital } = await supabaseAdmin
        .from('hospitals')
        .select('name')
        .eq('id', profile.hospital_id)
        .single()
      
      return NextResponse.json({ 
        hospital_id: profile.hospital_id,
        hospital_name: hospital?.name,
        message: 'Admin already associated with hospital'
      })
    }

    // Check if there are any hospitals created by this admin
    const { data: adminHospitals, error: hospitalError } = await supabaseAdmin
      .from('hospitals')
      .select('id, name')
      .eq('admin_id', user.id)
      .eq('status', 'active')

    if (hospitalError) {
      return NextResponse.json({ error: 'Error fetching hospitals' }, { status: 500 })
    }

    let hospitalId = null

    if (adminHospitals && adminHospitals.length > 0) {
      // Use the first hospital created by this admin
      hospitalId = adminHospitals[0].id
    } else {
      // Create a default hospital for this admin
      const { data: newHospital, error: createError } = await supabaseAdmin
        .from('hospitals')
        .insert({
          name: `${profile.full_name}'s Hospital`,
          address: 'Address to be updated',
          phone: 'Phone to be updated',
          admin_id: user.id,
          status: 'active'
        })
        .select('id, name')
        .single()

      if (createError) {
        return NextResponse.json({ error: 'Error creating hospital: ' + createError.message }, { status: 500 })
      }

      hospitalId = newHospital.id
    }

    // Update admin profile with hospital_id
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ hospital_id: hospitalId })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Error updating admin profile: ' + updateError.message }, { status: 500 })
    }

    // Get hospital name for response
    const { data: hospital } = await supabaseAdmin
      .from('hospitals')
      .select('name')
      .eq('id', hospitalId)
      .single()

    return NextResponse.json({ 
      hospital_id: hospitalId,
      hospital_name: hospital?.name,
      message: 'Admin successfully associated with hospital'
    })

  } catch (error: any) {
    console.error('Hospital association error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}