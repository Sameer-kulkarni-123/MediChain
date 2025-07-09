// src/components/MetaMaskAuth.js
import React, { useState, useEffect } from "react";
import Web3 from "web3";

const MetaMaskAuth = ({ onConnect }) => {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
        onConnect(accounts[0], web3);
      } catch (err) {
        setError("User rejected request or something went wrong.");
      }
    } else {
      setError("MetaMask not detected. Please install MetaMask.");
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          onConnect(accounts[0], new Web3(window.ethereum));
        } else {
          setAccount(null);
        }
      });
    }
  }, [onConnect]);

  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      {account ? (
        <div>
          <h3>🟢 Connected</h3>
          <p><strong>Account:</strong> {account}</p>
        </div>
      ) : (
        <>
          <h3>Connect your MetaMask wallet</h3>
          <button onClick={connectWallet} style={{ padding: "10px 20px", fontSize: "16px" }}>
            Connect MetaMask
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}
    </div>
  );
};

export default MetaMaskAuth;
