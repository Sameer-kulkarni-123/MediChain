"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

export default function BottlesQrListPage() {
  const [bottles, setBottles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/bottles")
      .then(res => res.json())
      .then(data => {
        setBottles(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-xl font-semibold">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">All Bottles with QR Codes</h1>
        {bottles.length === 0 && <p className="text-center text-gray-500">No bottles found.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {bottles.map(bottle => {
            const bottleUrl = `http://localhost:3000/bottle/${bottle.qr_code}`;
            return (
              <div
                key={bottle.qr_code}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow border border-gray-100 p-6 flex flex-col items-center"
              >
                <h2 className="text-lg font-semibold text-blue-700 break-all mb-2 text-center">QR Code</h2>
                <div className="mb-4">
                  <QRCode value={bottleUrl} size={128} />
                </div>
                <div className="text-xs text-gray-400 mb-4 break-all text-center">{bottleUrl}</div>
                <div className="w-full">
                  <p className="mb-1"><span className="font-medium text-gray-700">Blockchain Value:</span> <span className="text-gray-900">{bottle.blockchain_value}</span></p>
                  <p className="mb-1"><span className="font-medium text-gray-700">Certificate:</span> <span className="text-gray-900">{bottle.certificate}</span></p>
                  <p className="mb-1"><span className="font-medium text-gray-700">Details:</span> <span className="text-gray-900">{bottle.details}</span></p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}