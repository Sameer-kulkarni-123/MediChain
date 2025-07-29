import React, { useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

function App() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const html5QrCodeRef = useRef(null);

  const startScanning = () => {
    setError('');
    setScanning(true);
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("reader");
    }
    html5QrCodeRef.current.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 400, height: 400 }
      },
      (decodedText) => {
        window.location.href = decodedText;
      },
      (err) => {
        // Optionally handle scan errors
      }
    ).catch(err => {
      setError('Camera error: ' + err);
      setScanning(false);
    });
  };

  const stopScanning = () => {
    setScanning(false);
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current.clear();
      }).catch(() => {});
    }
  };

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current.clear();
        }).catch(() => {});
      }
    };
  }, []);

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          Scan a <span style={styles.brand}>MediChain</span> <span style={styles.qr}>QR Code</span>
        </h1>
        <p style={styles.subtitle}>
          <span style={styles.green}>Point your camera at a QR code to view entry details.</span>
        </p>
        <div id="reader" style={styles.reader}></div>
        {error && <div style={styles.error}>{error}</div>}
        <button
          style={styles.scanButton}
          onClick={scanning ? stopScanning : startScanning}
        >
          {scanning ? "Stop Scanning" : "Start Scanning"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: '100vh',
    minWidth: '100vw',
    background: '#fff',
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
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '1px solid #eaeaea',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: 8,
    color: '#222',
    letterSpacing: 1,
  },
  brand: {
    color: '#4f8cff',
    fontWeight: 800,
    letterSpacing: 1,
  },
  qr: {
    color: '#a259f7',
    fontWeight: 800,
    letterSpacing: 1,
  },
  subtitle: {
    color: '#222',
    fontSize: '1.05rem',
    marginBottom: 20,
    fontWeight: 500,
  },
  green: {
    color: '#43e97b',
  },
  reader: {
    width: 400,
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    background: '#f3f6fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 32px auto',
  },
  scanButton: {
    marginTop: 12,
    padding: '1em 2.5em',
    fontSize: '1.2rem',
    fontWeight: 700,
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(90deg, #4f8cff 0%, #a259f7 100%)',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(80,80,160,0.10)',
    transition: 'background 0.2s',
  },
  error: {
    color: '#b00020',
    background: '#ffeaea',
    borderRadius: 8,
    padding: '0.5em 1em',
    margin: '1em 0',
    fontWeight: 600,
  }
};

export default App;
