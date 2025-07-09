// src/App.js
import React, { useState } from "react";
import MetaMaskAuth from "./components/MetaMaskAuth";

const App = () => {
  const [account, setAccount] = useState(null);

  const handleConnect = (addr, web3Instance) => {
    setAccount(addr);
    // You can now use web3Instance to interact with the contract
  };

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>💊 Medicine Supply Chain DApp</h1>
      <MetaMaskAuth onConnect={handleConnect} />
    </div>
  );
};

export default App;
