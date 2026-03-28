import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id:           string
      name?:        string | null
      email?:       string | null
      image?:       string | null
      displayName:  string
      eloRating:    number
      streakCount:  number
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId:      string
    displayName: string
    eloRating:   number
    streakCount: number
  }
}
