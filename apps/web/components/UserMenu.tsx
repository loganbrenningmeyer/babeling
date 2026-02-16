"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

export function UserMenu() {
  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <SignInButton mode="modal">
          <Button size="sm" className="h-9 px-4">
            Sign In
          </Button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <UserButton>
          <UserButton.MenuItems>
            <UserButton.Link
              href="/preferences"
              label="Preferences"
              labelIcon={<SlidersHorizontal className="size-4" />}
            />
          </UserButton.MenuItems>
        </UserButton>
      </SignedIn>
    </div>
  );
}
