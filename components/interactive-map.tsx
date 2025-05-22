"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import type { Problem } from "@/types/supabase"

interface InteractiveMapProps {
  problems: Problem[]
  onProblemSelect: (problem: Problem) => void
}

// Create a component that will only run on the client
const InteractiveMapWithNoSSR = dynamic(
  () =>
    Promise.resolve(({ problems, onProblemSelect }: InteractiveMapProps) => {
      const mapRef = useRef<HTMLDivElement>(null)
      const mapInstanceRef = useRef<any>(null)
      const markersRef = useRef<{ [key: string]: any }>({})
      const [isMapReady, setIsMapReady] = useState(false)

      // Initialize map only once when component mounts
      useEffect(() => {
        // Only import Leaflet on the client side
        const initializeMap = async () => {
          // Check if map is already initialized
          if (mapInstanceRef.current || !mapRef.current) return

          const L = await import("leaflet")

          // Fix Leaflet default icon issue
          delete (L.Icon.Default.prototype as any)._getIconUrl
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
          })

          try {
            // Initialize the map
            const mapInstance = L.map(mapRef.current, {
              center: [11.020758, -74.849935],
              zoom: 15,
            })

            // Add tile layer
            const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(mapInstance)

            const arcgis = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
              subdomains: ['otile1','otile2','otile3','otile4']
            })/* .addTo(mapInstance); */

            L.control.layers({ "Mapa": osm, "Satelite": arcgis }, {}, { position: 'bottomleft' }).addTo(mapInstance)

            L.polygon([
              [11.021033, -74.852927],
              [11.021043, -74.851243],
              [11.020643, -74.849113],
              [11.017205, -74.850095],
              [11.017673, -74.851908],
              [11.017705, -74.852445],
              [11.019121, -74.852053],
              [11.019927, -74.851490]
            ], { color: "#367beb", weight: 2 }).addTo(mapInstance)

            L.polygon([
              [11.021341, -74.852079],
              [11.024764, -74.851543],
              [11.024669, -74.849842],
              [11.023866, -74.849906],
              [11.021834, -74.848833],
              [11.021013, -74.849058]
            ], { color: "#367beb", weight: 2 }).addTo(mapInstance)

            L.polygon([
              [11.020581, -74.848909],
              [11.020033, -74.845013],
              [11.019033, -74.845400],
              [11.019486, -74.848491],
              [11.018864, -74.848662],
              [11.019030, -74.849386]
            ], { color: "#367beb", weight: 2 }).addTo(mapInstance)

            // Store map reference
            mapInstanceRef.current = mapInstance

            // Force a resize after initialization to ensure proper rendering
            setTimeout(() => {
              mapInstance.invalidateSize()
            }, 250)

            setIsMapReady(true)
          } catch (error) {
            console.error("Error initializing map:", error)
          }
        }

        initializeMap()

        // Cleanup on unmount
        return () => {
          if (mapInstanceRef.current) {
            // Clear all markers
            Object.values(markersRef.current).forEach((marker) => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(marker)
              }
            })
            markersRef.current = {}

            // Remove event listeners
            mapInstanceRef.current.off()
            // Remove the map
            mapInstanceRef.current.remove()
            // Clear the reference
            mapInstanceRef.current = null
          }
        }
      }, [])

      // Update markers when problems change or map is ready
      useEffect(() => {
        const updateMarkers = async () => {
          // Only proceed if map is initialized and ready
          if (!mapInstanceRef.current || !isMapReady) return

          const L = await import("leaflet")

          // Clear existing markers
          Object.values(markersRef.current).forEach((marker) => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.removeLayer(marker)
            }
          })
          markersRef.current = {}

          // Add markers for each problem
          if (problems.length > 0) {
            const bounds = L.latLngBounds([])

            problems.forEach((problem) => {
              const lat = problem.latitude
              const lng = problem.longitude

              // Create icon based on problem category
              const getIconColor = (category: string) => {
                switch (category) {
                  case "waste":
                    return "red"
                  case "pollution":
                    return "blue"
                  case "deforestation":
                    return "green"
                  case "wildlife":
                    return "orange"
                  case "air":
                    return "purple"
                  default:
                    return "gray"
                }
              }

              const icon = L.divIcon({
                className: "custom-div-icon",
                html: `<div style="background-color: ${getIconColor(problem.category)}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })

              // Create marker
              const marker = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current)

              // Add popup with basic info
              marker.bindPopup(`<b>${problem.title}</b><br>${problem.category}`)

              // Add click handler
              marker.on("click", () => {
                onProblemSelect(problem)
              })

              // Store marker reference
              markersRef.current[problem.id] = marker

              // Extend bounds to include this marker
              bounds.extend([lat, lng])
            })

            // Fit map to bounds if we have problems
            if (problems.length > 0) {
              mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
            }
          }
        }

        updateMarkers()
      }, [problems, onProblemSelect, isMapReady])

      // Handle window resize
      useEffect(() => {
        const handleResize = () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
          }
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
      }, [isMapReady])

      return <div ref={mapRef} className="h-full w-full" style={{ minHeight: "500px", width: "100%" }} />
    }),
  { ssr: false },
)

export function InteractiveMap(props: InteractiveMapProps) {
  return <InteractiveMapWithNoSSR {...props} />
}
