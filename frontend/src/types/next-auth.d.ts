import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "SUPER_ADMIN" | "BRAND_ADMIN" | "MARKETER" | "ANALYST" | "AGENT";
      brands: { id: string; slug: string; name: string; color: string }[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: string;
    brands: { id: string; slug: string; name: string; color: string }[];
  }
}
