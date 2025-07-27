const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./database/config');
const Entry = require('./models/Entry');
const Bottle = require('./models/Bottle');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
console.log(PORT)

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date() });
});

// Get all entries
app.get('/api/entries', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get entry by ID
app.get('/api/entries/:id', async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new entry
app.post('/api/entries', async (req, res) => {
  try {
    const { type, wallet_address, location, certificate } = req.body;
    // Check if wallet address already exists
    const existingEntry = await Entry.findOne({ wallet_address });
    if (existingEntry) {
      return res.status(400).json({ message: 'Wallet address already exists' });
    }
    const newEntry = new Entry({ type, wallet_address, location, certificate });
    const savedEntry = await newEntry.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update entry
app.put('/api/entries/:id', async (req, res) => {
  try {
    const { type, wallet_address, location, certificate } = req.body;
    // Check if wallet address already exists for other entries
    const existingEntry = await Entry.findOne({ wallet_address, _id: { $ne: req.params.id } });
    if (existingEntry) {
      return res.status(400).json({ message: 'Wallet address already exists' });
    }
    const updatedEntry = await Entry.findByIdAndUpdate(
      req.params.id,
      { type, wallet_address, location, certificate },
      { new: true, runValidators: true }
    );
    if (!updatedEntry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete entry
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const deletedEntry = await Entry.findByIdAndDelete(req.params.id);
    if (!deletedEntry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get entries by type
app.get('/api/entries/type/:type', async (req, res) => {
  try {
    const entries = await Entry.find({ type: req.params.type }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate N bottles with blockchain_value and certificate
app.post('/api/bottles/generate', async (req, res) => {
  try {
    const { count, blockchain_value, certificate, details } = req.body;
    const bottles = [];
    for (let i = 0; i < (count || 10); i++) {
      // Use fallback values if blockchain_value or certificate are missing
      const safeBlockchain = blockchain_value || `blockchain${Date.now()}`;
      const safeCertificate = certificate || `cert${Math.floor(Math.random()*100000)}`;
      const qr_code = `${safeBlockchain}-${safeCertificate}-${Date.now()}-${Math.floor(Math.random()*100000)}`;
      bottles.push({
        qr_code,
        blockchain_value: safeBlockchain,
        certificate: safeCertificate,
        details: details || '',
        scanned: false,
        scan_history: [],
        report: { flagged: false }
      });
    }
    const created = await Bottle.insertMany(bottles);
    res.json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get bottle by QR code and update scan status
app.get('/api/bottles/:qr_code', async (req, res) => {
  try {
    const bottle = await Bottle.findOne({ qr_code: req.params.qr_code });
    if (!bottle) return res.status(404).json({ message: 'Bottle not found' });

    // If not scanned, mark as scanned
    if (!bottle.scanned) {
      bottle.scanned = true;
      bottle.scan_history.push({
        user_agent: req.headers['user-agent'],
        ip: req.ip
      });
      await bottle.save();
      return res.json({ ...bottle.toObject(), firstScan: true });
    } else {
      // Already scanned
      return res.json({ ...bottle.toObject(), firstScan: false });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Report bottle
app.post('/api/bottles/:qr_code/report', async (req, res) => {
  try {
    const bottle = await Bottle.findOne({ qr_code: req.params.qr_code });
    if (!bottle) return res.status(404).json({ message: 'Bottle not found' });

    bottle.report = {
      flagged: true,
      reason: req.body.reason,
      reported_at: new Date()
    };
    await bottle.save();
    res.json({ message: 'Report submitted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/bottles', async (req, res) => {
  try {
    const bottles = await Bottle.find();
    res.json(bottles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/bottles', async (req, res) => {
  try {
    await Bottle.deleteMany({});
    res.status(200).json({ message: 'All bottles deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 