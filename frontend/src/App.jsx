// src/App.js
import React, { useState } from "react";
import MetaMaskAuth from "./components/MetaMaskAuth";
import RegisterCrateForm from "./components/RegisterCrateForm";

const App = () => {
  const [account, setAccount] = useState(null);

  const handleConnect = (addr) => {
    setAccount(addr);
  };

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>💊 Medicine Supply Chain DApp</h1>
      <MetaMaskAuth onConnect={handleConnect} />
      {account && <RegisterCrateForm manufacturerAddress={account} />}
    </div>
  );
};

export default App;
