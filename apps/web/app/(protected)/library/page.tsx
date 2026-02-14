"use client";

// -------------------------
// User information provider
// -------------------------
import { useAppUser } from "@/components/AppUserProvider";

// -------------------------
// UI Components
// -------------------------
import { Pane } from "@/app/components/Pane"


export default function Library() {
  const PANE_H = "h-[80vh]"
  const PANE_DIV = `w-full ${PANE_H} px-12`

  return (
    <div className={PANE_DIV}>
      <Pane className={PANE_H}>
        Library
      </Pane>
    </div>
  )
}