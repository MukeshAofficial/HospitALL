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
  const doctorId = searchParams.get("doctorId")
  const date = searchParams.get("date")

  if (!doctorId || !date) {
    return NextResponse.json({ error: "Doctor ID and date are required" }, { status: 400 })
  }

  try {
    // Get existing appointments for the doctor on the specified date
    const startDate = new Date(date)
    const endDate = new Date(startDate.getTime() + 86400000)

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("appointment_date, duration_minutes")
      .eq("doctor_id", doctorId)
      .gte("appointment_date", startDate.toISOString())
      .lt("appointment_date", endDate.toISOString())
      .neq("status", "cancelled")

    if (error) throw error

    // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
    const availableSlots = []
    const workingHours = { start: 9, end: 17 } // 9 AM to 5 PM

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(startDate)
        slotTime.setHours(hour, minute, 0, 0)

        // Check if this slot conflicts with existing appointments
        const isBooked = appointments?.some((apt: any) => {
          const aptStart = new Date(apt.appointment_date)
          const aptEnd = new Date(aptStart.getTime() + (apt.duration_minutes || 30) * 60000)
          return slotTime >= aptStart && slotTime < aptEnd
        })

        if (!isBooked) {
          availableSlots.push({
            time: slotTime.toISOString(),
            display: slotTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          })
        }
      }
    }

    return NextResponse.json({ availableSlots })
  } catch (error) {
    console.error("Error fetching available slots:", error)
    return NextResponse.json({ error: "Failed to fetch available slots" }, { status: 500 })
  }
}
