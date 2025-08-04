"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function QRViewer() {
  const [qrs, setQrs] = useState([])
  const searchParams = useSearchParams()
  const show = searchParams.get("view") === "qrs"

  useEffect(() => {
    const stored = localStorage.getItem("qrList")
    if (stored) {
      setQrs(JSON.parse(stored))
    }
  }, [])

  if (!show) return <p>No QR data</p>

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Generated QR Codes</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
        {qrs.map(({ bottleId, qrUrl }) => (
          <div key={bottleId}>
            <img src={qrUrl} alt={bottleId} style={{ width: "150px" }} />
            <p style={{ textAlign: "center" }}>{bottleId}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
