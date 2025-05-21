export type Problem = {
  id: string
  title: string
  description: string
  category: string
  latitude: number
  longitude: number
  status: "pending" | "in-progress" | "resolved"
  image_url: string | null
  created_at: string
}

export type ProblemFormData = {
  title: string
  description: string
  category: string
  latitude: number
  longitude: number
  image?: File | null
}
