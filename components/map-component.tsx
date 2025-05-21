"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"

interface MapComponentProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void
}

// Create a component that will only run on the client
const MapComponentWithNoSSR = dynamic(
  () =>
    Promise.resolve(({ onLocationSelect }: MapComponentProps) => {
      const mapRef = useRef<HTMLDivElement>(null)
      const mapInstanceRef = useRef<any>(null)
      const markerRef = useRef<any>(null)
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
              center: [11.018658, -74.850841],
              zoom: 16,
            })

            // Add tile layer
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(mapInstance)

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

            // Handle map click to set marker
            mapInstance.on("click", (e) => {
              const { lat, lng } = e.latlng

              // Remove existing marker if any
              if (markerRef.current) {
                mapInstance.removeLayer(markerRef.current)
              }

              // Add new marker
              markerRef.current = L.marker([lat, lng]).addTo(mapInstance)

              // Call the callback with the selected location
              onLocationSelect({ lat, lng })
            })

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
            // Remove event listeners
            mapInstanceRef.current.off()
            // Remove the map
            mapInstanceRef.current.remove()
            // Clear the reference
            mapInstanceRef.current = null
            markerRef.current = null
          }
        }
      }, [onLocationSelect])

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

      return <div ref={mapRef} className="h-full w-full" style={{ minHeight: "300px", width: "100%" }} />
    }),
  { ssr: false },
)

export function MapComponent(props: MapComponentProps) {
  return <MapComponentWithNoSSR {...props} />
}
