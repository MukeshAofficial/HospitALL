import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
        },
      },
    },
  )

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")
  const doctorId = searchParams.get("doctorId")
  const patientId = searchParams.get("patientId")

  try {
    let query = supabase.from("appointments").select(`
      *,
      patients!inner(profile_id, profiles!inner(full_name)),
      profiles!appointments_doctor_id_fkey(full_name)
    `)

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(startDate.getTime() + 86400000)
      query = query.gte("appointment_date", startDate.toISOString()).lt("appointment_date", endDate.toISOString())
    }

    if (doctorId) {
      query = query.eq("doctor_id", doctorId)
    }

    if (patientId) {
      query = query.eq("patient_id", patientId)
    }

    const { data, error } = await query.order("appointment_date", { ascending: true })

    if (error) throw error

    return NextResponse.json({ appointments: data })
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
        },
      },
    },
  )

  try {
    const body = await request.json()
    const { patient_id, doctor_id, appointment_date, duration_minutes, appointment_type, notes } = body

    // Check for conflicts
    const conflictCheck = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", doctor_id)
      .gte("appointment_date", new Date(appointment_date).toISOString())
      .lt(
        "appointment_date",
        new Date(new Date(appointment_date).getTime() + (duration_minutes || 30) * 60000).toISOString(),
      )
      .neq("status", "cancelled")

    if (conflictCheck.data && conflictCheck.data.length > 0) {
      return NextResponse.json({ error: "Time slot is already booked" }, { status: 409 })
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_id,
        doctor_id,
        appointment_date,
        duration_minutes: duration_minutes || 30,
        appointment_type,
        notes,
        status: "scheduled",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ appointment: data }, { status: 201 })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
  }
}
