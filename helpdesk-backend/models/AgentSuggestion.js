import mongoose from 'mongoose';

const agentSuggestionSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  predictedCategory: {
    type: String,
    enum: ['billing', 'tech', 'shipping', 'other'],
    required: true
  },
  articleIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  }],
  draftReply: {
    type: String,
    required: true,
    maxlength: 2000
  },
  citations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  }],
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  autoClosed: {
    type: Boolean,
    default: false
  },
  modelInfo: {
    provider: {
      type: String,
      required: true,
      default: 'stub'
    },
    model: {
      type: String,
      required: true,
      default: 'keyword-matcher-v1'
    },
    promptVersion: {
      type: String,
      required: true,
      default: '1.0'
    },
    latencyMs: {
      type: Number,
      default: 0
    }
  },
  matchReasons: [{
    type: String
  }],
  feedback: {
    helpful: {
      type: Boolean,
      default: null
    },
    comment: {
      type: String,
      maxlength: 500
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
agentSuggestionSchema.index({ ticketId: 1 });
agentSuggestionSchema.index({ confidence: -1 });
agentSuggestionSchema.index({ predictedCategory: 1 });
agentSuggestionSchema.index({ createdAt: -1 });

const AgentSuggestion = mongoose.model('AgentSuggestion', agentSuggestionSchema);

export default AgentSuggestion;


