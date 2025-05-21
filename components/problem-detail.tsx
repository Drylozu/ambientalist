import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPin } from "lucide-react"
import type { Problem } from "@/types/supabase"

interface ProblemDetailProps {
  problem: Problem
}

export function ProblemDetail({ problem }: ProblemDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "in-progress":
        return "bg-blue-500"
      case "resolved":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "waste":
        return "Waste Dumping"
      case "pollution":
        return "Water Pollution"
      case "deforestation":
        return "Deforestation"
      case "wildlife":
        return "Wildlife Endangerment"
      case "air":
        return "Air Pollution"
      default:
        return "Other"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{problem.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {new Date(problem.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(problem.status)}>
            {problem.status.charAt(0).toUpperCase() + problem.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {problem.image_url && (
          <img
            src={problem.image_url || "/placeholder.svg"}
            alt={problem.title}
            className="w-full h-40 object-cover rounded-md"
          />
        )}
        <div>
          <h4 className="text-sm font-medium mb-1">Category</h4>
          <p className="text-sm">{getCategoryLabel(problem.category)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-1">Location</h4>
          <p className="text-sm flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {problem.latitude.toFixed(6)}, {problem.longitude.toFixed(6)}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-1">Description</h4>
          <p className="text-sm">{problem.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
