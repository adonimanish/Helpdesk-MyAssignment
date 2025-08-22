// routes/tickets.js
import express from 'express';
import Ticket from '../models/Ticket.js';
import AgentSuggestion from '../models/AgentSuggestion.js';
import AuditLog from '../models/AuditLog.js';
import Config from '../models/Config.js';
import { authenticate, authorize } from '../middleware/auth.js';
import aiSuggestionService from '../services/aiSuggestionService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create a new ticket (triggers AI triage)
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, category = 'other' } = req.body;
    
    // Generate trace ID for this ticket lifecycle
    const traceId = uuidv4();
    
    // Create the ticket
    const ticket = new Ticket({
      title,
      description,
      category,
      status: 'open',
      createdBy: req.user._id,
      traceId
    });

    const savedTicket = await ticket.save();
    
    // Log ticket creation
    await AuditLog.create({
      ticketId: savedTicket._id,
      traceId,
      actor: 'user',
      action: 'TICKET_CREATED',
      meta: {
        userId: req.user._id,
        category,
        title: title.substring(0, 100)
      },
      timestamp: new Date()
    });

    // Trigger AI triage asynchronously
    triggerAITriage(savedTicket, traceId);

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket: savedTicket
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error.message
    });
  }
});

// Get all tickets (with filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, category, my } = req.query;
    const filter = {};

    // Apply filters
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (my === 'true') filter.createdBy = req.user._id;

    // Role-based filtering
    if (req.user.role === 'user') {
      filter.createdBy = req.user._id; // Users can only see their own tickets
    }

    const tickets = await Ticket.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tickets
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
});

// ============ SPECIFIC ROUTES MUST BE BEFORE /:id ==============

// Get tickets for specific user
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Security check - users can only see their own tickets
    if (req.user.role === 'user' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const tickets = await Ticket.find({ createdBy: userId })
      .populate('createdBy', 'name email')
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${tickets.length} tickets for user ${userId}`);

    res.json({
      success: true,
      tickets
    });

  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
});

// Get AI suggestion for a ticket
router.get('/:id/suggestion', authenticate, async (req, res) => {
  try {
    const suggestion = await AgentSuggestion.findOne({ ticketId: req.params.id })
      .populate({
        path: 'articleIds',
        model: 'Article',
        select: 'title body tags'
      });

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'No AI suggestion found for this ticket'
      });
    }

    res.json({
      success: true,
      suggestion
    });

  } catch (error) {
    console.error('Error fetching AI suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI suggestion',
      error: error.message
    });
  }
});

// Submit feedback on AI suggestion
router.post('/:id/suggestion/feedback', authenticate, async (req, res) => {
  try {
    const { helpful, feedback } = req.body;
    const { id: ticketId } = req.params;

    const suggestion = await AgentSuggestion.findOne({ ticketId });
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'AI suggestion not found'
      });
    }

    // Update suggestion with feedback
    suggestion.feedback = {
      helpful,
      comment: feedback,
      submittedBy: req.user._id,
      submittedAt: new Date()
    };
    
    await suggestion.save();

    // Log feedback
    await AuditLog.create({
      ticketId,
      traceId: suggestion.traceId || uuidv4(),
      actor: req.user.role,
      action: 'FEEDBACK_SUBMITTED',
      meta: {
        helpful,
        feedback: feedback?.substring(0, 200),
        userId: req.user._id
      },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// Agent reply to ticket
router.post('/:id/reply', authenticate, authorize(['agent', 'admin']), async (req, res) => {
  try {
    const { reply, status = 'resolved' } = req.body;
    const ticketId = req.params.id;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Update ticket
    ticket.status = status;
    ticket.assignee = req.user._id;
    ticket.agentReply = reply;
    ticket.repliedAt = new Date();
    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    // Log agent reply
    await AuditLog.create({
      ticketId,
      traceId: ticket.traceId || uuidv4(),
      actor: 'agent',
      action: 'REPLY_SENT',
      meta: {
        agentId: req.user._id,
        status,
        replyLength: reply.length
      },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Reply sent successfully',
      ticket
    });

  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message
    });
  }
});

// Assign ticket to agent
router.post('/:id/assign', authenticate, authorize(['agent', 'admin']), async (req, res) => {
  try {
    const { assigneeId } = req.body;
    const ticketId = req.params.id;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    ticket.assignee = assigneeId;
    ticket.status = 'assigned';
    await ticket.save();

    // Log assignment
    await AuditLog.create({
      ticketId,
      traceId: ticket.traceId || uuidv4(),
      actor: req.user.role,
      action: 'TICKET_ASSIGNED',
      meta: {
        assignedBy: req.user._id,
        assignedTo: assigneeId
      },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      ticket
    });

  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ticket',
      error: error.message
    });
  }
});

// Get audit log for a ticket
router.get('/:id/audit', authenticate, async (req, res) => {
  try {
    const auditLogs = await AuditLog.find({ ticketId: req.params.id })
      .sort({ timestamp: 1 });

    res.json({
      success: true,
      auditLogs
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

// ============ GENERIC /:id ROUTE MUST BE LAST! ==============

// Get ticket by ID (MUST BE LAST!)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignee', 'name email');
    // FIXED: Removed .populate('comments.author', 'name email')

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check permissions
    if (req.user.role === 'user' && ticket.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      ticket
    });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message
    });
  }
});

// Trigger AI triage (async function)
async function triggerAITriage(ticket, traceId) {
  try {
    console.log(`[AI Triage] Starting triage for ticket ${ticket._id}`);
    
    // Step 1: Generate AI suggestions
    await AuditLog.create({
      ticketId: ticket._id,
      traceId,
      actor: 'system',
      action: 'AGENT_TRIAGE_STARTED',
      meta: { ticketId: ticket._id },
      timestamp: new Date()
    });

    const suggestion = await aiSuggestionService.generateSuggestions(ticket);
    
    // Step 2: Save agent suggestion
    const agentSuggestion = new AgentSuggestion(suggestion);
    const savedSuggestion = await agentSuggestion.save();

    // Step 3: Update ticket with suggestion ID
    ticket.agentSuggestionId = savedSuggestion._id;
    ticket.status = 'triaged';
    await ticket.save();

    // Log classification
    await AuditLog.create({
      ticketId: ticket._id,
      traceId,
      actor: 'system',
      action: 'AGENT_CLASSIFIED',
      meta: {
        predictedCategory: suggestion.predictedCategory,
        confidence: suggestion.confidence,
        originalCategory: ticket.category
      },
      timestamp: new Date()
    });

    // Log KB retrieval
    await AuditLog.create({
      ticketId: ticket._id,
      traceId,
      actor: 'system',
      action: 'KB_RETRIEVED',
      meta: {
        articlesFound: suggestion.articleIds.length,
        articleIds: suggestion.articleIds
      },
      timestamp: new Date()
    });

    // Log draft generation
    await AuditLog.create({
      ticketId: ticket._id,
      traceId,
      actor: 'system',
      action: 'DRAFT_GENERATED',
      meta: {
        draftLength: suggestion.draftReply.length,
        citations: suggestion.citations?.length || 0
      },
      timestamp: new Date()
    });

    // Step 4: Check if should auto-close
    const config = await Config.findOne() || { 
      autoCloseEnabled: process.env.AUTO_CLOSE_ENABLED === 'true',
      confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.8 
    };

    if (config.autoCloseEnabled && suggestion.confidence >= config.confidenceThreshold) {
      // Auto-close the ticket
      ticket.status = 'resolved';
      ticket.resolvedAt = new Date();
      agentSuggestion.autoClosed = true;
      
      await Promise.all([
        ticket.save(),
        agentSuggestion.save()
      ]);

      // Log auto-close
      await AuditLog.create({
        ticketId: ticket._id,
        traceId,
        actor: 'system',
        action: 'AUTO_CLOSED',
        meta: {
          confidence: suggestion.confidence,
          threshold: config.confidenceThreshold,
          draftReply: suggestion.draftReply.substring(0, 200)
        },
        timestamp: new Date()
      });

      console.log(`[AI Triage] Ticket ${ticket._id} auto-closed (confidence: ${suggestion.confidence})`);
    } else {
      // Assign to human
      ticket.status = 'waiting_human';
      await ticket.save();

      await AuditLog.create({
        ticketId: ticket._id,
        traceId,
        actor: 'system',
        action: 'ASSIGNED_TO_HUMAN',
        meta: {
          reason: config.autoCloseEnabled ? 'low_confidence' : 'auto_close_disabled',
          confidence: suggestion.confidence,
          threshold: config.confidenceThreshold
        },
        timestamp: new Date()
      });

      console.log(`[AI Triage] Ticket ${ticket._id} assigned to human (confidence: ${suggestion.confidence})`);
    }

  } catch (error) {
    console.error(`[AI Triage] Error processing ticket ${ticket._id}:`, error);
    
    // Log error
    await AuditLog.create({
      ticketId: ticket._id,
      traceId,
      actor: 'system',
      action: 'TRIAGE_ERROR',
      meta: {
        error: error.message,
        stack: error.stack?.substring(0, 500)
      },
      timestamp: new Date()
    });
  }
}

export default router;




