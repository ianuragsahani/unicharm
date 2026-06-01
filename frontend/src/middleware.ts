export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/customers/:path*", "/cross-sell/:path*", "/segments/:path*", "/journeys/:path*", "/campaigns/:path*", "/whatsapp/:path*", "/analytics/:path*", "/ai/:path*", "/loyalty/:path*", "/admin/:path*"],
};
