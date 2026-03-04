import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/upload(.*)",
  "/library(.*)",
  "/preferences(.*)",
  "/documents(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      const redirectUrl = new URL("/", req.url);
      const requestedPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;

      redirectUrl.searchParams.set("auth", "sign-up");
      redirectUrl.searchParams.set("redirect_to", requestedPath);
      redirectUrl.searchParams.set("auth_request", crypto.randomUUID());

      return NextResponse.redirect(redirectUrl);
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
