import express from "express";
import AuditLog from "../models/AuditLog.js";

const router = express.Router();

// Get all audit logs
router.get('/', async (req, res) => {
  try {
    const logs = await AuditLog.find();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get audit log by ID
router.get('/:id', async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Audit log not found" });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create audit log
router.post('/', async (req, res) => {
  try {
    const newLog = new AuditLog(req.body);
    const savedLog = await newLog.save();
    res.status(201).json(savedLog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;


