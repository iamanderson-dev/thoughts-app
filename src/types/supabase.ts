export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          username: string
          joined_at: string
          // ...
        }
      }
      thoughts: {
        Row: {
          id: string
          user_id: string
          content: string
          profile_image_url: string
          created_at: string
          // other columns if any
        }
      }
      // ... other tables
    }
  }
}
