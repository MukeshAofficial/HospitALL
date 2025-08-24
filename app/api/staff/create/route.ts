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
    const body = await request.json()
    const { email, fullName, role, phone, department, specialization, licenseNumber, notes } = body

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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, hospital_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create the new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'TempPassword123!', // Temporary password
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
        phone: phone,
        department: department,
        specialization: specialization,
        license_number: licenseNumber,
        notes: notes,
        hospital_id: profile.hospital_id
      }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Create the profile record with hospital_id (the trigger might not set hospital_id correctly)
    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email: email,
        full_name: fullName,
        role: role,
        phone: phone,
        hospital_id: profile.hospital_id
      }, {
        onConflict: 'id'
      })

    if (upsertError) {
      console.error('Profile creation error:', upsertError)
      // Don't fail the whole request, but log the error
      console.log('Warning: Profile may not have correct hospital_id')
    }

    return NextResponse.json({ 
      success: true, 
      user: newUser.user,
      message: `Successfully created account for ${fullName}. Temporary password: TempPassword123!`
    })

  } catch (error: any) {
    console.error('Staff creation error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}