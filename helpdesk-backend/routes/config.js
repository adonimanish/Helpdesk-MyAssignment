// routes/config.js
import express from 'express';
import Config from '../models/Config.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get configuration
router.get('/', authenticate, async (req, res) => {
  try {
    let config = await Config.findOne();
    
    if (!config) {
      // Create default config if none exists
      config = new Config({
        autoCloseEnabled: process.env.AUTO_CLOSE_ENABLED === 'true',
        confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.8,
        slaHours: parseInt(process.env.SLA_HOURS) || 24
      });
      await config.save();
    }

    // Hide sensitive settings from non-admin users
    if (req.user.role !== 'admin') {
      const publicConfig = {
        slaHours: config.slaHours,
        maxTicketsPerUser: config.maxTicketsPerUser
      };
      return res.json({
        success: true,
        config: publicConfig
      });
    }

    res.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration',
      error: error.message
    });
  }
});

// Update configuration (Admin only)
router.put('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      autoCloseEnabled,
      confidenceThreshold,
      slaHours,
      maxTicketsPerUser,
      aiProviderSettings,
      categoryThresholds
    } = req.body;

    let config = await Config.findOne();
    
    if (!config) {
      config = new Config();
    }

    // Update fields if provided
    if (autoCloseEnabled !== undefined) {
      config.autoCloseEnabled = autoCloseEnabled;
    }
    
    if (confidenceThreshold !== undefined) {
      if (confidenceThreshold < 0 || confidenceThreshold > 1) {
        return res.status(400).json({
          success: false,
          message: 'Confidence threshold must be between 0 and 1'
        });
      }
      config.confidenceThreshold = confidenceThreshold;
    }
    
    if (slaHours !== undefined) {
      if (slaHours < 1) {
        return res.status(400).json({
          success: false,
          message: 'SLA hours must be at least 1'
        });
      }
      config.slaHours = slaHours;
    }
    
    if (maxTicketsPerUser !== undefined) {
      config.maxTicketsPerUser = maxTicketsPerUser;
    }
    
    if (aiProviderSettings) {
      config.aiProviderSettings = { ...config.aiProviderSettings, ...aiProviderSettings };
    }
    
    if (categoryThresholds) {
      config.categoryThresholds = { ...config.categoryThresholds, ...categoryThresholds };
    }

    await config.save();

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config
    });

  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration',
      error: error.message
    });
  }
});

// Reset configuration to defaults (Admin only)
router.post('/reset', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await Config.deleteMany({});
    
    const defaultConfig = new Config({
      autoCloseEnabled: true,
      confidenceThreshold: 0.8,
      slaHours: 24,
      maxTicketsPerUser: 10
    });
    
    await defaultConfig.save();

    res.json({
      success: true,
      message: 'Configuration reset to defaults',
      config: defaultConfig
    });

  } catch (error) {
    console.error('Error resetting config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset configuration',
      error: error.message
    });
  }
});

export default router;



