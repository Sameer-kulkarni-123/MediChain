// src/components/RegisterCrateForm.js
import React, { useState } from "react";
import { registerCrate } from "./apis.js"; // import the API you created

const RegisterCrateForm = ({ manufacturerAddress }) => {
  const [form, setForm] = useState({
    crateCode: "",
    batchId: "",
    medicineId: "",
    medicineName: "",
    manufacturerId: "",
    currentAddressId: "",
    cidDocuments: "",
    bottleCount: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setStatus("🕐 Submitting...");
    const event = await registerCrate({
      ...form,
      manufacturerAddress,
      currentAddress: manufacturerAddress,
    });

    if (event) {
      setStatus(`✅ Crate "${event.crateCode}" registered with ${event.bottleCount} bottles.`);
    } else {
      setStatus("✅ Crate registered successfully! (No event data returned)");
    }
  } catch (err) {
    console.error(err);
    setStatus("❌ Failed to register crate.");
  }
};


  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "1.5rem", border: "1px solid #ccc", borderRadius: "10px" }}>
      <h2>📦 Register New Medicine Crate</h2>
      <form onSubmit={handleSubmit}>
        {[
          { name: "crateCode", label: "Crate Code (e.g., QXY)" },
          { name: "batchId", label: "Batch ID" },
          { name: "medicineId", label: "Medicine ID" },
          { name: "medicineName", label: "Medicine Name" },
          { name: "manufacturerId", label: "Manufacturer ID" },
          { name: "currentAddressId", label: "Manufacturer Location ID" },
          { name: "cidDocuments", label: "IPFS CID for Certification" },
          { name: "bottleCount", label: "Number of Bottles in Crate" },
        ].map(({ name, label }) => (
          <div key={name} style={{ marginBottom: "1rem" }}>
            <label><strong>{label}:</strong></label><br />
            <input
              type="text"
              name={name}
              value={form[name]}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
        ))}
        <button type="submit" style={{ padding: "10px 20px", fontSize: "16px" }}>Register Crate</button>
      </form>
      {status && <p style={{ marginTop: "1rem" }}>{status}</p>}
    </div>
  );
};

export default RegisterCrateForm;
