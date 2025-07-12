"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function BottlePage() {
  const params = useParams();
  const qr_code = params?.qr_code;
  const [bottle, setBottle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (qr_code) {
      fetch(`http://localhost:5000/api/bottles/${qr_code}`)
        .then(res => res.json())
        .then(data => {
          setBottle(data);
          setLoading(false);
        });
    }
  }, [qr_code]);

  const handleReport = async () => {
    setReporting(true);
    const res = await fetch(`http://localhost:5000/api/bottles/${qr_code}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    });
    if (res.ok) setReportMsg("Report submitted. Thank you!");
    else setReportMsg("Failed to submit report.");
    setReporting(false);
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!bottle || bottle.message === "Bottle not found") return <div style={styles.notFound}>Bottle not found.</div>;

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <h1 style={styles.title}>Bottle Details</h1>
        <div style={styles.infoRow}><span style={styles.label}>QR Code:</span> <span style={styles.value}>{bottle.qr_code}</span></div>
        <div style={styles.infoRow}><span style={styles.label}>Blockchain Value:</span> <span style={styles.value}>{bottle.blockchain_value}</span></div>
        <div style={styles.infoRow}><span style={styles.label}>Certificate:</span> <span style={styles.value}>{bottle.certificate}</span></div>
        <div style={styles.infoRow}><span style={styles.label}>Details:</span> <span style={styles.value}>{bottle.details}</span></div>
        {bottle.firstScan ? (
          <div style={styles.validStatus}>✅ This is the first scan. Bottle is <span style={{ color: '#43e97b', fontWeight: 700 }}>valid</span>.</div>
        ) : (
          <div style={styles.invalidStatus}>
            <span style={{ fontWeight: 700 }}>⚠️ This QR code has already been scanned!</span>
            <div style={{ marginTop: 18 }}>
              <textarea
                placeholder="Describe the suspicious activity..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                style={styles.textarea}
              />
              <button onClick={handleReport} disabled={reporting || !reason} style={styles.reportBtn}>
                {reporting ? "Reporting..." : "Report"}
              </button>
              {reportMsg && <div style={styles.reportMsg}>{reportMsg}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: '100vh',
    background: '#f7fafd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(80,80,160,0.10)',
    padding: '2.5rem 2rem 2rem 2rem',
    maxWidth: 480,
    width: '100%',
    textAlign: 'left' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch',
    border: '1px solid #eaeaea',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    marginBottom: 18,
    color: '#4f8cff',
    letterSpacing: 1,
    textAlign: 'center' as const,
  },
  infoRow: {
    marginBottom: 10,
    display: 'flex',
    gap: 8,
    fontSize: '1.08rem',
  },
  label: {
    color: '#a259f7',
    fontWeight: 600,
    minWidth: 120,
    display: 'inline-block',
  },
  value: {
    color: '#222',
    fontWeight: 500,
    wordBreak: 'break-all' as const,
  },
  validStatus: {
    marginTop: 28,
    color: '#43e97b',
    background: '#eafff3',
    borderRadius: 8,
    padding: '1em',
    fontWeight: 600,
    textAlign: 'center' as const,
    fontSize: '1.1rem',
    boxShadow: '0 2px 8px rgba(67,233,123,0.08)',
  },
  invalidStatus: {
    marginTop: 28,
    color: '#b00020',
    background: '#fff0f0',
    borderRadius: 8,
    padding: '1em',
    fontWeight: 600,
    textAlign: 'center' as const,
    fontSize: '1.1rem',
    boxShadow: '0 2px 8px rgba(176,0,32,0.08)',
  },
  textarea: {
    width: '100%',
    borderRadius: 8,
    border: '1px solid #a259f7',
    padding: '0.7em',
    fontSize: '1rem',
    marginBottom: 10,
    marginTop: 10,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  },
  reportBtn: {
    padding: '0.7em 2em',
    fontSize: '1.1rem',
    fontWeight: 700,
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(90deg, #4f8cff 0%, #a259f7 100%)',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(80,80,160,0.10)',
    transition: 'background 0.2s',
  },
  reportMsg: {
    marginTop: 10,
    color: '#43e97b',
    fontWeight: 600,
    fontSize: '1rem',
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    color: '#4f8cff',
    fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
  },
  notFound: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    color: '#b00020',
    fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
  },
};