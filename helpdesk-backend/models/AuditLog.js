import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  traceId: {
    type: String,
    required: true,
    index: true
  },
  actor: {
    type: String,
    enum: ['system', 'agent', 'user', 'admin'],
    required: true
  },
  action: {
    type: String,
    enum: [
      'TICKET_CREATED',
      'AGENT_TRIAGE_STARTED',
      'AGENT_CLASSIFIED',
      'KB_RETRIEVED',
      'DRAFT_GENERATED',
      'AUTO_CLOSED',
      'ASSIGNED_TO_HUMAN',
      'TICKET_ASSIGNED',
      'REPLY_SENT',
      'STATUS_CHANGED',
      'FEEDBACK_SUBMITTED',
      'TRIAGE_ERROR'
    ],
    required: true
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: false 
});

// Indexes for better performance
auditLogSchema.index({ ticketId: 1, timestamp: 1 });
auditLogSchema.index({ traceId: 1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });

// Compound index for common queries
auditLogSchema.index({ ticketId: 1, actor: 1, timestamp: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;


