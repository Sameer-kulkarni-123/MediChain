"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EntryPage() {
  const params = useParams();
  const id = params?.id;
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:5000/api/entries/${id}`)
        .then(res => {
          if (!res.ok) throw new Error("Entry not found");
          return res.json();
        })
        .then(data => {
          setEntry(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!entry) return <div>No entry found.</div>;

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h1>Entry Details</h1>
      <p><strong>Type:</strong> {entry.type}</p>
      <p><strong>Wallet Address:</strong> {entry.wallet_address}</p>
      <p><strong>Location:</strong> {entry.location}</p>
      <p><strong>Certificate:</strong> {entry.certificate}</p>
      <p><strong>ID:</strong> {entry._id}</p>
    </div>
  );
} 