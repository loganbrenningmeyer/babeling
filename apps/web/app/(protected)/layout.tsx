import { AppUserProvider } from "@/components/AppUserProvider";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AppUserProvider>{children}</AppUserProvider>;
}