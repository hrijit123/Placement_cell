import { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
        if (dbUser && (dbUser.status === "BANNED" || dbUser.status === "SUSPENDED")) {
          // Block sign in for banned or suspended users
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      if (token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } })
        if (dbUser) {
          token.role = dbUser.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: '/'
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
