import React, { useState } from "react";
import {
  registerCrate,
  createSubCrate,
  sendCrate,
  sendSubCrate,
  receiveCrate,
  retailerReceivedCrate,
  retailerReceivedSubCrate,
  scanBottle,
  debugIsExists
} from "../apis"

function App() {
  const [crateData, setCrateData] = useState({
    crateCode: "",
    productID: "",
    medicineName: "",
    cidDocument: "",
    bottleCount: 0,
    bottleIds: [],
  });

  const [subCrateData, setSubCrateData] = useState({
    parentCrateCode: "",
    subCrateID: "",
    bottleIds: [],
  });

  const [sendData, setSendData] = useState({
    crateCode: "",
    subCrateCode: "",
    receiverAddress: "",
  });
  
  const[ crateCodeForDebug, setcrateCodeForDebug ] = useState("")

  const [bottleCode, setBottleCode] = useState("");

  const handleChange = (e, objSetter) => {
    const { name, value } = e.target;
    objSetter((prev) => ({
      ...prev,
      [name]: name === "bottleIds" ? value.split(",") : value,
    }));
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>🧪 Blockchain Crate Tracker - Tester</h2>

      <section>
        <h3>Register Crate</h3>
        <input name="crateCode" placeholder="Crate Code" onChange={(e) => handleChange(e, setCrateData)} />
        <input name="productID" placeholder="Product ID" onChange={(e) => handleChange(e, setCrateData)} />
        <input name="medicineName" placeholder="Medicine Name" onChange={(e) => handleChange(e, setCrateData)} />
        <input name="cidDocument" placeholder="CID Document" onChange={(e) => handleChange(e, setCrateData)} />
        <input name="bottleCount" placeholder="Bottle Count" type="number" onChange={(e) => handleChange(e, setCrateData)} />
        <input name="bottleIds" placeholder="Bottle IDs (comma separated)" onChange={(e) => handleChange(e, setCrateData)} />
        <button onClick={() => {
          console.log("calling registerCrate")
          console.log("crate code", crateData.crateCode)
          console.log("product id", crateData.productID)
          console.log("medicineName", crateData.medicineName)
          console.log("cidDocument", crateData.cidDocument)
          console.log("bottleCount", crateData.bottleCount)
          console.log("bottleIds", crateData.bottleIds)

        registerCrate(
          crateData.crateCode,
          crateData.productID,
          crateData.medicineName,
          crateData.cidDocument,
          parseInt(crateData.bottleCount),
          crateData.bottleIds
        )
        }}>Register Crate</button>
      </section>

      <section>
        <h3>Create Sub Crate</h3>
        <input name="parentCrateCode" placeholder="Parent Crate Code" onChange={(e) => handleChange(e, setSubCrateData)} />
        <input name="subCrateID" placeholder="Sub Crate ID" onChange={(e) => handleChange(e, setSubCrateData)} />
        <input name="bottleIds" placeholder="Bottle IDs (comma separated)" onChange={(e) => handleChange(e, setSubCrateData)} />
        <button onClick={() => {
          console.log(subCrateData.parentCrateCode)
          console.log(subCrateData.subCrateID)
          console.log(subCrateData.bottleIds)

          createSubCrate(
            subCrateData.parentCrateCode,
            subCrateData.subCrateID,
            subCrateData.bottleIds
          )
        }
        }>Create Sub Crate</button>
      </section>

      <section>
        <h3>Send Crate</h3>
        <input name="crateCode" placeholder="Crate Code" onChange={(e) => handleChange(e, setSendData)} />
        <input name="receiverAddress" placeholder="Receiver Address" onChange={(e) => handleChange(e, setSendData)} />
        <button onClick={() => sendCrate(sendData.crateCode, sendData.receiverAddress)}>Send Crate</button>
      </section>

      <section>
        <h3>Send Sub Crate</h3>
        <input name="crateCode" placeholder="Crate Code" onChange={(e) => handleChange(e, setSendData)} />
        <input name="subCrateCode" placeholder="Sub Crate Code" onChange={(e) => handleChange(e, setSendData)} />
        <input name="receiverAddress" placeholder="Receiver Address" onChange={(e) => handleChange(e, setSendData)} />
        <button onClick={() => sendSubCrate(sendData.crateCode, sendData.subCrateCode, sendData.receiverAddress)}>Send Sub Crate</button>
      </section>

      <section>
        <h3>Receive Crate</h3>
        <input placeholder="Crate Code" onChange={(e) => setSendData(prev => ({ ...prev, crateCode: e.target.value }))} />
        <button onClick={() => receiveCrate(sendData.crateCode)}>Receive Crate</button>
      </section>

      <section>
        <h3>Retailer Receives Crate</h3>
        <input placeholder="Crate Code" onChange={(e) => setSendData(prev => ({ ...prev, crateCode: e.target.value }))} />
        <button onClick={() => retailerReceivedCrate(sendData.crateCode)}>Retailer Receives Crate</button>
      </section>

      <section>
        <h3>Retailer Receives Sub Crate</h3>
        <input placeholder="Crate Code" onChange={(e) => setSendData(prev => ({ ...prev, crateCode: e.target.value }))} />
        <input name="subCrateCode" placeholder="Sub Crate Code" onChange={(e) => handleChange(e, setSendData)} />
        <button onClick={() => retailerReceivedSubCrate(sendData.crateCode, sendData.subCrateCode)}>Retailer Receives Sub Crate</button>
      </section>

      <section>
        <h3>Scan Bottle</h3>
        <input placeholder="Bottle Code" onChange={(e) => setBottleCode(e.target.value)} />
        <button onClick={() => scanBottle(bottleCode)}>Scan Bottle</button>
      </section>

      <section>
        <h3>debug isExists (deprecated)</h3>
        <input name="CrateCode" placeholder="Crate Code" onChange={(e) => setcrateCodeForDebug(e.target.value)} />
        <button onClick={() => {
          console.log("crate code in debug isExists", crateCodeForDebug)
          debugIsExists(crateCodeForDebug)}}>debug isExists</button>
      </section>
    </div>
  );
}

export default App;
