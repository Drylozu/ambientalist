"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MapPin, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { MapComponent } from "@/components/map-component"
import { createClient } from "@/utils/supabase/client"
import type { ProblemFormData } from "@/types/supabase"

export default function ReportPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Omit<ProblemFormData, "latitude" | "longitude">>({
    title: "",
    description: "",
    category: "",
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  // Memoize the location select handler to prevent unnecessary re-renders
  const handleLocationSelect = useCallback((location: { lat: number; lng: number }) => {
    setSelectedLocation(location)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedLocation) {
      toast({
        title: "Location required",
        description: "Please select a location on the map",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      let imageUrl = null

      // Upload image if one is selected
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("problem_images")
          .upload(filePath, imageFile)

        if (uploadError) {
          throw new Error(`Error uploading image: ${uploadError.message}`)
        }

        // Get public URL for the uploaded image
        const {
          data: { publicUrl },
        } = supabase.storage.from("problem_images").getPublicUrl(filePath)

        imageUrl = publicUrl
      }

      // Insert problem data into the database
      const { error: insertError } = await supabase.from("problems").insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        image_url: imageUrl,
        status: "pending",
      })

      if (insertError) {
        throw new Error(`Error inserting problem data: ${insertError.message}`)
      }

      toast({
        title: "Problem reported successfully",
        description: "Thank you for helping us identify ecological issues.",
      })

      // Redirect to the map page after successful submission
      setTimeout(() => {
        router.push("/map")
      }, 1500)
    } catch (error) {
      console.error("Error submitting problem:", error)
      toast({
        title: "Error reporting problem",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <MapPin className="h-6 w-6 text-green-600" />
          <span className="ml-2 text-xl font-bold">Ambientalist</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/">
            Report Problem
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/map">
            View Map
          </Link>
        </nav>
      </header>
      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Report an Ecological Problem
              </h1>
              <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Help us identify environmental issues in your area by filling out the form below.
              </p>
            </div>
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Problem Details</CardTitle>
                  <CardDescription>
                    Please provide as much information as possible about the ecological issue you've observed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Problem Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="E.g., Illegal Waste Dumping"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Problem Category</Label>
                    <Select value={formData.category} onValueChange={handleCategoryChange} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waste">Waste Dumping</SelectItem>
                        <SelectItem value="pollution">Water Pollution</SelectItem>
                        <SelectItem value="deforestation">Deforestation</SelectItem>
                        <SelectItem value="wildlife">Wildlife Endangerment</SelectItem>
                        <SelectItem value="air">Air Pollution</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Problem Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Please describe the problem in detail..."
                      className="min-h-[120px]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Upload Photo Evidence</Label>
                    <div className="flex flex-col items-center justify-center gap-4">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Problem preview"
                            className="max-h-[200px] rounded-md object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={clearImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md">
                          <label
                            htmlFor="image-upload"
                            className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                          >
                            <Upload className="h-8 w-8 text-gray-400" />
                            <span className="mt-2 text-sm text-gray-500">Click to upload a photo</span>
                            <Input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Location on Map</Label>
                    <div className="h-[300px] w-full rounded-md border overflow-hidden">
                      <MapComponent onLocationSelect={handleLocationSelect} />
                    </div>
                    {selectedLocation && (
                      <p className="text-sm text-gray-500">
                        Selected location: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" type="button" asChild>
                    <Link href="/">Cancel</Link>
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting || !selectedLocation}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full border-t px-4 md:px-6">
        <p className="text-xs text-gray-500">© 2025 Ambientalist. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
