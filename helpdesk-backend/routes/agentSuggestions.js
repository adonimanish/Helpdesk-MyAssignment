import express from "express";
import AgentSuggestion from "../models/AgentSuggestion.js";

const router = express.Router();

// Get all suggestions
router.get('/', async (req, res) => {
  try {
    const suggestions = await AgentSuggestion.find();
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get suggestion by ID
router.get('/:id', async (req, res) => {
  try {
    const suggestion = await AgentSuggestion.findById(req.params.id);
    if (!suggestion) return res.status(404).json({ message: "Suggestion not found" });
    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new suggestion
router.post('/', async (req, res) => {
  try {
    const newSuggestion = new AgentSuggestion(req.body);
    const savedSuggestion = await newSuggestion.save();
    res.status(201).json(savedSuggestion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update suggestion by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedSuggestion = await AgentSuggestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSuggestion) return res.status(404).json({ message: "Suggestion not found" });
    res.json(updatedSuggestion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete suggestion by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedSuggestion = await AgentSuggestion.findByIdAndDelete(req.params.id);
    if (!deletedSuggestion) return res.status(404).json({ message: "Suggestion not found" });
    res.json({ message: "Suggestion deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;


