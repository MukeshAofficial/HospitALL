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
        console.log("[v0] AuthGuard: Starting auth check")

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        console.log("[v0] AuthGuard: User data:", user ? { id: user.id, email: user.email } : null)
        console.log("[v0] AuthGuard: Auth error:", error)

        if (error || !user) {
          console.log("[v0] AuthGuard: No user found, redirecting to:", redirectTo)
          router.push(redirectTo)
          return
        }

        if (allowedRoles) {
          console.log("[v0] AuthGuard: Checking roles, allowed:", allowedRoles)
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, hospital_id, full_name")
            .eq("id", user.id)
            .single()

          console.log("[v0] AuthGuard: Profile data:", profile)
          console.log("[v0] AuthGuard: Profile error:", profileError)

          if (profileError) {
            console.error("[v0] AuthGuard: Profile fetch error:", profileError)
            // If profile doesn't exist, redirect to appropriate onboarding
            if (profileError.code === 'PGRST116') {
              console.log("[v0] AuthGuard: No profile found, redirecting to signup")
              router.push("/auth/signup")
              return
            }
            // For other errors, redirect to login
            router.push("/auth/login")
            return
          }

          if (!profile || !allowedRoles.includes(profile.role)) {
            console.log("[v0] AuthGuard: Role check failed, user role:", profile?.role, "redirecting to /unauthorized")
            router.push("/unauthorized")
            return
          }

          console.log("[v0] AuthGuard: Role check passed, user role:", profile.role)
        }

        console.log("[v0] AuthGuard: Authorization successful")
        setIsAuthorized(true)
      } catch (error) {
        console.error("[v0] AuthGuard: Auth check failed:", error)
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
