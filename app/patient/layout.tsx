import type React from "react"
import { PatientLayout } from "@/components/patient-layout"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PatientLayout>{children}</PatientLayout>
}
