"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { MapPin, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { InteractiveMap } from "@/components/interactive-map"
import { ProblemDetail } from "@/components/problem-detail"
import { createClient } from "@/utils/supabase/client"
import type { Problem } from "@/types/supabase"

export default function MapPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([])
  const [filters, setFilters] = useState({
    waste: true,
    pollution: true,
    deforestation: true,
    wildlife: true,
    air: true,
    other: true,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch problems from Supabase
  useEffect(() => {
    async function fetchProblems() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("problems").select("*").order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        if (data) {
          setProblems(data as Problem[])
        }
      } catch (error) {
        console.error("Error fetching problems:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProblems()
  }, [])

  // Memoize the problem select handler to prevent unnecessary re-renders
  const handleProblemSelect = useCallback((problem: Problem) => {
    setSelectedProblem(problem)
  }, [])

  const handleFilterChange = useCallback((category: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [category]: checked,
    }))
  }, [])

  // Filter problems based on selected categories
  useEffect(() => {
    const filtered = problems.filter((problem) => filters[problem.category as keyof typeof filters])
    setFilteredProblems(filtered)
  }, [filters, problems])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <MapPin className="h-6 w-6 text-green-600" />
          <span className="ml-2 text-xl font-bold">Ambientalist</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/report">
            Report Problem
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/map">
            View Map
          </Link>
        </nav>
      </header>
      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ecological Problems Map</h1>
            <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Explore reported environmental issues in your area and track their resolution status.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter Problems
                  </CardTitle>
                  <CardDescription>Select problem categories to display on the map</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="waste"
                        checked={filters.waste}
                        onCheckedChange={(checked) => handleFilterChange("waste", checked as boolean)}
                      />
                      <Label htmlFor="waste">Waste Dumping</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pollution"
                        checked={filters.pollution}
                        onCheckedChange={(checked) => handleFilterChange("pollution", checked as boolean)}
                      />
                      <Label htmlFor="pollution">Water Pollution</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="deforestation"
                        checked={filters.deforestation}
                        onCheckedChange={(checked) => handleFilterChange("deforestation", checked as boolean)}
                      />
                      <Label htmlFor="deforestation">Deforestation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="wildlife"
                        checked={filters.wildlife}
                        onCheckedChange={(checked) => handleFilterChange("wildlife", checked as boolean)}
                      />
                      <Label htmlFor="wildlife">Wildlife Endangerment</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="air"
                        checked={filters.air}
                        onCheckedChange={(checked) => handleFilterChange("air", checked as boolean)}
                      />
                      <Label htmlFor="air">Air Pollution</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="other"
                        checked={filters.other}
                        onCheckedChange={(checked) => handleFilterChange("other", checked as boolean)}
                      />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {selectedProblem && <ProblemDetail problem={selectedProblem} />}
            </div>
            <Card className="h-[calc(100vh-250px)] min-h-[500px]">
              <CardContent className="p-0 h-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading map data...</p>
                  </div>
                ) : (
                  <InteractiveMap problems={filteredProblems} onProblemSelect={handleProblemSelect} />
                )}
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 flex justify-center">
            <Button className="bg-green-600 hover:bg-green-700" asChild>
              <Link href="/report">Report a New Problem</Link>
            </Button>
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
