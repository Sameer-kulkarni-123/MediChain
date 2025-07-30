// server.js

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { scanBottle, debugIsExists } from "./validate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.get("/debug/:code", async (req, res) => {
  try {
    console.log("The crate code : ", req.params.code)
    const isValid = await debugIsExists(req.params.code);

    if (isValid) {
      res.sendFile(path.join(__dirname, "public", "success.html"));
    } else {
      res.sendFile(path.join(__dirname, "public", "fail.html"));
    }
  } catch (err) {
    console.error("Error debugging crate:", err);
    res.sendFile(path.join(__dirname, "public", "catch.html"));
    // res.status(500).send("Internal Server Error");
  }
});

app.get("/favicon.ico", (req, res) => {
  res.status(204).end(); // No Content
});


app.get("/:code", async (req, res) => {
  try {
    console.log("The bottle code : ", req.params.code)
    const isValid = await scanBottle(req.params.code);

    if (isValid) {
      res.sendFile(path.join(__dirname, "public", "success.html"));
    } else {
      res.sendFile(path.join(__dirname, "public", "fail.html"));
    }
  } catch (err) {
    console.error("Error scanning bottle:", err);
    res.sendFile(path.join(__dirname, "public", "catch.html"));
    // res.status(500).send("Internal Server Error");
  }
});





app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
