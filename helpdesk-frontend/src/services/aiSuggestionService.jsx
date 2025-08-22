// services/aiSuggestionService.js
import Article from '../models/Article.js';

class AISuggestionService {
  constructor() {
    // Define keyword mappings for different categories
    this.keywordMappings = {
      billing: [
        'payment', 'charge', 'charged', 'billing', 'invoice', 'refund', 'money',
        'card', 'credit', 'debit', 'subscription', 'plan', 'upgrade', 'downgrade',
        'cancel', 'double', 'duplicate', 'overcharged', 'fee', 'cost', 'price'
      ],
      tech: [
        'error', 'bug', 'broken', 'not working', 'crash', 'freeze', 'slow',
        '500', '404', '403', 'server', 'login', 'password', 'access', 'loading',
        'timeout', 'connection', 'browser', 'website', 'app', 'application',
        'technical', 'system', 'database', 'api', 'integration'
      ],
      shipping: [
        'shipping', 'delivery', 'package', 'order', 'tracking', 'shipped',
        'delayed', 'lost', 'damaged', 'courier', 'fedex', 'ups', 'dhl',
        'address', 'delivered', 'received', 'missing', 'wrong item'
      ],
      account: [
        'account', 'profile', 'settings', 'preferences', 'email', 'username',
        'delete', 'update', 'change', 'modify', 'reset', 'forgot', 'locked',
        'suspended', 'banned', 'verification', 'activate'
      ]
    };

    // Priority weights for different matching criteria
    this.weights = {
      exactKeywordMatch: 10,
      categoryMatch: 8,
      titleSimilarity: 6,
      tagMatch: 5,
      partialMatch: 3
    };
  }

  // Main function to generate suggestions for a ticket
  async generateSuggestions(ticket) {
    try {
      console.log(`Generating AI suggestions for ticket: ${ticket.title}`);

      // Get all published KB articles
      const articles = await Article.find({ status: 'published' });
      
      if (articles.length === 0) {
        console.log('No KB articles found for suggestions');
        return this.getDefaultSuggestions(ticket.category);
      }

      // Analyze ticket content
      const ticketAnalysis = this.analyzeTicketContent(ticket);
      
      // Score and rank articles
      const scoredArticles = this.scoreArticles(articles, ticketAnalysis, ticket);
      
      // Generate suggestions based on top matches
      const suggestions = this.createSuggestions(scoredArticles, ticket);

      console.log(`Generated ${suggestions.length} suggestions for ticket ${ticket._id}`);
      return suggestions;

    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return this.getDefaultSuggestions(ticket.category);
    }
  }

  // Analyze ticket content to extract keywords and context
  analyzeTicketContent(ticket) {
    const content = `${ticket.title} ${ticket.description}`.toLowerCase();
    
    return {
      content,
      detectedCategory: this.detectCategory(content),
      keywords: this.extractKeywords(content),
      urgencyLevel: this.detectUrgency(content),
      entities: this.extractEntities(content)
    };
  }

  // Detect the most likely category based on keywords
  detectCategory(content) {
    const categoryScores = {};

    Object.keys(this.keywordMappings).forEach(category => {
      const keywords = this.keywordMappings[category];
      let score = 0;
      
      keywords.forEach(keyword => {
        const matches = (content.match(new RegExp(keyword, 'g')) || []).length;
        score += matches * this.weights.exactKeywordMatch;
      });
      
      categoryScores[category] = score;
    });

    // Return category with highest score
    return Object.keys(categoryScores).reduce((a, b) => 
      categoryScores[a] > categoryScores[b] ? a : b
    );
  }

  // Extract relevant keywords from content
  extractKeywords(content) {
    const words = content.split(/\s+/);
    const relevantKeywords = [];

    // Extract keywords that match our mappings
    Object.values(this.keywordMappings).flat().forEach(keyword => {
      if (content.includes(keyword)) {
        relevantKeywords.push(keyword);
      }
    });

    return relevantKeywords;
  }

  // Detect urgency indicators
  detectUrgency(content) {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'broken', 'down'];
    const urgentCount = urgentKeywords.filter(keyword => content.includes(keyword)).length;
    
    if (urgentCount > 0) return 'high';
    if (content.includes('soon') || content.includes('quickly')) return 'medium';
    return 'normal';
  }

  // Extract entities like error codes, numbers, etc.
  extractEntities(content) {
    const entities = {
      errorCodes: content.match(/\b\d{3}\b/g) || [], // HTTP error codes
      orderNumbers: content.match(/#\d+/g) || [],
      amounts: content.match(/\$\d+(?:\.\d{2})?/g) || []
    };

    return entities;
  }

  // Score articles based on relevance to ticket
  scoreArticles(articles, ticketAnalysis, ticket) {
    return articles.map(article => {
      let score = 0;

      // Category match bonus
      if (article.tags.includes(ticket.category) || article.tags.includes(ticketAnalysis.detectedCategory)) {
        score += this.weights.categoryMatch;
      }

      // Keyword matching
      ticketAnalysis.keywords.forEach(keyword => {
        if (article.title.toLowerCase().includes(keyword) || 
            article.body.toLowerCase().includes(keyword)) {
          score += this.weights.exactKeywordMatch;
        }
      });

      // Tag matching
      article.tags.forEach(tag => {
        if (ticketAnalysis.content.includes(tag)) {
          score += this.weights.tagMatch;
        }
      });

      // Title similarity (basic word overlap)
      const titleWords = article.title.toLowerCase().split(/\s+/);
      const ticketTitleWords = ticket.title.toLowerCase().split(/\s+/);
      const commonWords = titleWords.filter(word => ticketTitleWords.includes(word));
      score += commonWords.length * this.weights.titleSimilarity;

      return {
        article,
        score,
        matchReasons: this.getMatchReasons(article, ticketAnalysis, ticket)
      };
    })
    .filter(item => item.score > 0) // Only include articles with some relevance
    .sort((a, b) => b.score - a.score); // Sort by relevance score
  }

  // Get reasons why an article was matched
  getMatchReasons(article, ticketAnalysis, ticket) {
    const reasons = [];

    if (article.tags.includes(ticket.category)) {
      reasons.push(`Matches category: ${ticket.category}`);
    }

    ticketAnalysis.keywords.forEach(keyword => {
      if (article.title.toLowerCase().includes(keyword) || 
          article.body.toLowerCase().includes(keyword)) {
        reasons.push(`Contains keyword: ${keyword}`);
      }
    });

    return reasons;
  }

  // Create formatted suggestions from scored articles
  createSuggestions(scoredArticles, ticket) {
    const suggestions = [];
    const topArticles = scoredArticles.slice(0, 3); // Top 3 matches

    topArticles.forEach((item, index) => {
      const confidence = Math.min(95, Math.max(60, (item.score / 20) * 100));
      
      suggestions.push({
        type: 'kb_article',
        title: item.article.title,
        content: this.extractRelevantContent(item.article.body),
        confidence: Math.round(confidence),
        source: 'Knowledge Base',
        articleId: item.article._id,
        matchReasons: item.matchReasons,
        priority: index + 1
      });
    });

    // Add category-specific suggestions
    const categorySuggestion = this.getCategorySuggestion(ticket.category);
    if (categorySuggestion) {
      suggestions.push(categorySuggestion);
    }

    return suggestions;
  }

  // Extract relevant portion of article content (first paragraph)
  extractRelevantContent(body) {
    const sentences = body.split('.').filter(s => s.trim().length > 0);
    return sentences.slice(0, 2).join('.') + (sentences.length > 2 ? '...' : '');
  }

  // Get category-specific general suggestions
  getCategorySuggestion(category) {
    const categorySuggestions = {
      billing: {
        type: 'general_advice',
        title: 'General Billing Assistance',
        content: 'For billing issues, please have your account information and recent invoices ready. Our billing team can help resolve payment discrepancies.',
        confidence: 75,
        source: 'System',
        priority: 99
      },
      tech: {
        type: 'general_advice',
        title: 'Technical Troubleshooting',
        content: 'Try clearing your browser cache, using incognito mode, or testing with a different browser. If the issue persists, please provide error messages.',
        confidence: 70,
        source: 'System',
        priority: 99
      },
      shipping: {
        type: 'general_advice',
        title: 'Shipping Support',
        content: 'Check your email for tracking information. Deliveries typically take 3-5 business days. Contact us if your package is significantly delayed.',
        confidence: 80,
        source: 'System',
        priority: 99
      }
    };

    return categorySuggestions[category] || null;
  }

  // Fallback suggestions when no KB articles are available
  getDefaultSuggestions(category) {
    return [
      {
        type: 'default',
        title: 'We\'re Here to Help',
        content: 'Your ticket has been received and will be reviewed by our support team. We\'ll get back to you soon with a personalized solution.',
        confidence: 60,
        source: 'System',
        priority: 1
      },
      this.getCategorySuggestion(category)
    ].filter(Boolean);
  }
}

export default new AISuggestionService();