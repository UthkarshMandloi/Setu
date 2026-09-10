import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    // Standard Login - the primary auth method
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { startupProfile: true }
        });

        if (!user || !user.password) {
          console.log(`User not found or no password: ${credentials.email}`);
          return null;
        }

        try {
          // Use bcrypt to verify the password
          const isValid = await bcryptjs.compare(credentials.password, user.password);

          if (isValid) {
            console.log(`Authentication successful for user: ${user.email}, role: ${user.role}`);
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              // Include any additional fields needed
              aadhaarNumber: (user as any).aadhaarNumber,
              nameAsPerAadhaar: (user as any).nameAsPerAadhaar,
              photoUrl: (user as any).photoUrl
            };
          } else {
            console.log(`Invalid password for user: ${user.email}`);
            return null;
          }
        } catch (error) {
          console.error("Error during password verification:", error);
          return null;
        }
      }
    }),
    // Mock DigiLocker (for startup users)
    CredentialsProvider({
      id: "digilocker",
      name: "DigiLocker Mock",
      credentials: {
        token: { label: "Mock Token", type: "text" }
      },
      async authorize(credentials) {
        const user = await prisma.user.findFirst({
          where: { role: "STARTUP" },
          include: { startupProfile: true }
        });

        if (user) {
          return {
            id: user.id,
            name: user.name || "Mock DigiLocker User",
            email: user.email || "mockuser@digilocker.gov.in",
            role: user.role,
            aadhaarNumber: "123456789012",
            nameAsPerAadhaar: "RAJESH KUMAR",
            photoUrl: "https://picsum.photos/seed/digilocker/200/200.jpg"
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        // Copy any additional fields
        if ((user as any).aadhaarNumber) token.aadhaarNumber = (user as any).aadhaarNumber;
        if ((user as any).nameAsPerAadhaar) token.nameAsPerAadhaar = (user as any).nameAsPerAadhaar;
        if ((user as any).photoUrl) token.photoUrl = (user as any).photoUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        if (token.aadhaarNumber) (session.user as any).aadhaarNumber = token.aadhaarNumber;
        if (token.nameAsPerAadhaar) (session.user as any).nameAsPerAadhaar = token.nameAsPerAadhaar;
        if (token.photoUrl) (session.user as any).photoUrl = token.photoUrl;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-key",
  debug: process.env.NODE_ENV === "development"
};