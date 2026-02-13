import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/translate(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // -------------------------
  // Takes to sign-in page if not signed in
  // -------------------------
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};