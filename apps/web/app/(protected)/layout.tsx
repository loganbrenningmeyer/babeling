import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AppUserProvider } from "@/components/AppUserProvider";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/?auth=sign-up&redirect_to=/upload&auth_request=protected-layout");
  }

  return <AppUserProvider>{children}</AppUserProvider>;
}
