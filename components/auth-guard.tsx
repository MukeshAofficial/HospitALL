"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export function AuthGuard({ children, allowedRoles, redirectTo = "/auth/login" }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()

      try {
        // Only log important auth events, not every check
        const {          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error || !user) {
          router.push(redirectTo)
          return
        }

        if (allowedRoles) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, hospital_id, full_name")
            .eq("id", user.id)
            .single()

          if (profileError) {
            // If profile doesn't exist, redirect to appropriate onboarding
            if (profileError.code === 'PGRST116') {
              router.push("/auth/signup")
              return
            }
            // For other errors, redirect to login
            router.push("/auth/login")
            return
          }

          if (!profile || !allowedRoles.includes(profile.role)) {
            router.push("/unauthorized")
            return
          }

          // For patients, check profile completion first
          if (profile.role === 'patient') {
            const currentPath = window.location.pathname
            
            // Fetch patient data once
            const { data: patient, error: patientError } = await supabase
              .from('patients')
              .select('hospital_id, date_of_birth, emergency_contact_name')
              .eq('profile_id', user.id)
              .single()
            
            if (patientError) {
              router.push("/auth/login")
              return
            }
            
            // Skip profile completeness check if already on profile completion page
            if (currentPath !== '/patient/profile-completion') {
              // Check if basic profile information is complete
              if (!patient.date_of_birth || !patient.emergency_contact_name) {
                router.push("/patient/profile-completion")
                return
              }
            }

            // Only check hospital selection for appointment-related routes
            const appointmentRoutes = ['/patient/appointments', '/patient/appointments/new', '/patient/appointments/book']
            
            if (appointmentRoutes.some(route => currentPath.startsWith(route))) {
              if (!patient.hospital_id) {
                router.push("/select-hospital")
                return
              }
            }
          }
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("[AuthGuard] Auth check failed:", error)
        router.push(redirectTo)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, allowedRoles, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">HospitALL</h2>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
