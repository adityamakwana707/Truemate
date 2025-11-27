import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { User } from "next-auth"
import type { JWT } from "next-auth/jwt"

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Demo user for testing
          if (credentials.email === "demo@truthmate.com" && credentials.password === "demo123") {
            return {
              id: "1",
              email: credentials.email,
              name: "Demo User",
              apiKey: "demo-api-key"
            }
          }
          
          // In a real application, you would:
          // 1. Query your database for the user by email
          // 2. Compare the provided password with the hashed password in the database
          // 3. Return the user object if authentication succeeds
          
          // For development purposes, we'll accept any valid email/password combination
          // that's at least 6 characters long (to match the signup validation)
          if (credentials.password.length >= 6) {
            return {
              id: Date.now().toString(),
              email: credentials.email,
              name: credentials.email.split("@")[0],
              apiKey: `api-${Date.now()}`
            }
          }

          return null
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.sub = user.id
        token.apiKey = user.apiKey
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub
        session.user.apiKey = token.apiKey
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    // Remove signUp as NextAuth doesn't support custom signup pages
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
export { authOptions }