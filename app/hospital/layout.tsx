import type React from "react"
import { HospitalLayout } from "@/components/hospital-layout"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <HospitalLayout>{children}</HospitalLayout>
}
