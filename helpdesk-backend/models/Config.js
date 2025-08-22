import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  autoCloseEnabled: {
    type: Boolean,
    default: true
  },
  confidenceThreshold: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8
  },
  slaHours: {
    type: Number,
    default: 24,
    min: 1
  },
  maxTicketsPerUser: {
    type: Number,
    default: 10,
    min: 1
  },
  aiProviderSettings: {
    provider: {
      type: String,
      enum: ['stub', 'openai', 'anthropic'],
      default: 'stub'
    },
    model: {
      type: String,
      default: 'keyword-matcher-v1'
    },
    temperature: {
      type: Number,
      min: 0,
      max: 2,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      default: 500
    }
  },
  categoryThresholds: {
    billing: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    },
    tech: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.75
    },
    shipping: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    },
    other: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.9
    }
  }
}, {
  timestamps: true
});

// Ensure only one config document exists
configSchema.index({ _id: 1 }, { unique: true });

const Config = mongoose.model('Config', configSchema);

export default Config;



