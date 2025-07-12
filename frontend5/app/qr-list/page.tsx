"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";


export default function EntriesListPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/entries")
      .then(res => res.json())
      .then(data => {
        setEntries(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto" }}>
      <h1>All Entries with QR Codes</h1>
      {entries.length === 0 && <p>No entries found.</p>}
      {entries.map(entry => {
        const entryUrl = `http://localhost:3000/entries/${entry._id}`;
        return (
          <div key={entry._id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <h2>{entry.type} - {entry.location}</h2>
            <p><strong>Wallet Address:</strong> {entry.wallet_address}</p>
            <p><strong>Certificate:</strong> {entry.certificate}</p>
            <p><strong>ID:</strong> {entry._id}</p>
            <div style={{ marginTop: 16 }}>
              <QRCode value={entryUrl} size={128} />
              <div style={{ fontSize: 12, marginTop: 8 }}>{entryUrl}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}