import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { supabaseAdmin } from '@/lib/supabase'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId:     process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],

  // ── Custom pages ─────────────────────────────────────────────
  pages: {
    signIn: '/login',
    error:  '/login',
  },

  // ── Callbacks ─────────────────────────────────────────────────
  callbacks: {

    // Runs after successful OAuth login
    async signIn({ user, account }) {
      if (!user.email) return false

      try {
        // Check if user already exists in our DB
        const { data: existing } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single()

        if (!existing) {
          // First login — create the user row
          const { error } = await supabaseAdmin.from('users').insert({
            id:                 user.id,
            email:              user.email,
            display_name:       user.name ?? user.email.split('@')[0],
            avatar_url:         user.image ?? null,
            preferred_language: 'python',
            elo_rating:         1200,
            streak_count:       0,
            longest_streak:     0,
            reflection_text:    null,
          } as any) // Type check issue in NextAuth callback context

          if (error) {
            console.error('Error creating user:', error)
            return false
          }
        }

        return true
      } catch (err) {
        console.error('signIn callback error:', err)
        return false
      }
    },

    // Attach user id and elo to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id

        // Fetch current Elo from DB
        const { data } = await supabaseAdmin
          .from('users')
          .select('elo_rating, streak_count, display_name')
          .eq('email', token.email!)
          .single()

        if (data) {
          token.eloRating    = data.elo_rating
          token.streakCount  = data.streak_count
          token.displayName  = data.display_name
        }
      }
      return token
    },

    // Expose token data to session
    async session({ session, token }) {
      if (token) {
        session.user.id          = token.userId  as string
        session.user.eloRating   = token.eloRating  as number
        session.user.streakCount = token.streakCount as number
        session.user.displayName = token.displayName as string
      }
      return session
    },
  },

  session: {
    strategy: 'jwt',
    maxAge:   30 * 24 * 60 * 60, // 30 days
  },
}
