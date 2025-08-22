// services/aiSuggestionService.js
import Article from '../models/Article.js';
import AgentSuggestion from '../models/AgentSuggestion.js';

class AISuggestionService {
  constructor() {
    // Enhanced keyword mappings with more comprehensive patterns
    this.keywordMappings = {
      billing: [
        'payment', 'charge', 'refund', 'invoice', 'bill', 'credit', 'debit',
        'subscription', 'plan', 'upgrade', 'downgrade', 'cancel', 'money',
        'cost', 'price', 'fee', 'transaction', 'receipt', 'statement',
        'billing', 'account', 'card', 'paypal', 'bank', 'dispute', 'balance'
      ],
      tech: [
        'error', 'bug', '500', '404', 'crash', 'broken', 'not working',
        'login', 'password', 'server', 'database', 'API', 'timeout',
        'slow', 'performance', 'mobile', 'browser', 'app', 'website',
        'code', 'technical', 'system', 'integration', 'sync', 'access',
        'account', 'reset', 'forgot', 'locked', 'security', 'authentication',
        'connection', 'internet', 'wifi', 'network', 'loading', 'freeze'
      ],
      shipping: [
        'delivery', 'shipping', 'package', 'tracking', 'shipment',
        'courier', 'postal', 'address', 'location', 'delayed', 'lost',
        'damaged', 'warehouse', 'dispatch', 'transit', 'arrived',
        'destination', 'expedite', 'overnight', 'express', 'track',
        'order', 'ship', 'deliver', 'receive', 'missing', 'status'
      ]
    };
  }

  // Main method to generate suggestions for a ticket
  async generateSuggestions(ticket) {
    try {
      console.log(`[AI Agent] Starting triage for ticket ${ticket._id}`);
      
      // Step 1: Classify category with improved algorithm
      const classification = this.classifyTicket(ticket);
      console.log(`[AI Agent] Classification: ${classification.predictedCategory} (confidence: ${classification.confidence})`);
      
      // Step 2: Retrieve relevant KB articles
      const relevantArticles = await this.retrieveKBArticles(ticket, classification.predictedCategory);
      console.log(`[AI Agent] Found ${relevantArticles.length} relevant articles`);
      
      // Step 3: Draft reply with confidence boosting
      const draftReply = this.generateDraftReply(ticket, relevantArticles, classification.predictedCategory);
      console.log(`[AI Agent] Generated draft reply`);
      
      // Step 4: Calculate final confidence (boost if we have good articles)
      let finalConfidence = classification.confidence;
      if (relevantArticles.length > 0) {
        const avgRelevance = relevantArticles.reduce((sum, art) => sum + art.relevanceScore, 0) / relevantArticles.length;
        finalConfidence = Math.min(0.95, finalConfidence + (avgRelevance * 0.1));
      }
      
      // Step 5: Create agent suggestion
      const suggestion = {
        ticketId: ticket._id,
        predictedCategory: classification.predictedCategory,
        articleIds: relevantArticles.map(article => article._id),
        draftReply: draftReply.text,
        citations: draftReply.citations,
        confidence: finalConfidence,
        autoClosed: false,
        modelInfo: {
          provider: 'enhanced-stub',
          model: 'keyword-matcher-v2',
          promptVersion: '2.0',
          latencyMs: Date.now() - ticket.createdAt
        },
        matchReasons: classification.reasons || []
      };

      return suggestion;
    } catch (error) {
      console.error('[AI Agent] Error generating suggestions:', error);
      throw error;
    }
  }

  // Enhanced classification with better confidence calculation
  classifyTicket(ticket) {
    const text = `${ticket.title} ${ticket.description}`.toLowerCase();
    const scores = {};
    const reasons = [];
    const detailedMatches = {};

    // Calculate scores for each category with weighted matching
    Object.keys(this.keywordMappings).forEach(category => {
      const keywords = this.keywordMappings[category];
      let score = 0;
      let matchCount = 0;
      const matchedKeywords = [];

      keywords.forEach(keyword => {
        // Multiple matching patterns for better coverage
        const patterns = [
          new RegExp(`\\b${keyword}\\b`, 'gi'),           // Exact word
          new RegExp(`\\b${keyword}\\w*`, 'gi'),          // Word starts with keyword
          new RegExp(`\\w*${keyword}\\w*`, 'gi')          // Contains keyword
        ];

        let keywordScore = 0;
        patterns.forEach((pattern, index) => {
          const matches = text.match(pattern);
          if (matches) {
            // Weight: exact match = 3, starts with = 2, contains = 1
            const weight = 3 - index;
            keywordScore += matches.length * weight;
            matchedKeywords.push(keyword);
          }
        });

        if (keywordScore > 0) {
          matchCount++;
          score += keywordScore;
          
          // Bonus for title matches
          if (ticket.title.toLowerCase().includes(keyword)) {
            score += 3;
          }
        }
      });

      scores[category] = score;
      detailedMatches[category] = { score, matchCount, matchedKeywords: [...new Set(matchedKeywords)] };
      
      if (matchedKeywords.length > 0) {
        const uniqueKeywords = [...new Set(matchedKeywords)];
        reasons.push(`Contains ${category} keywords: ${uniqueKeywords.slice(0, 5).join(', ')}`);
      }
    });

    // Find best category
    const maxScore = Math.max(...Object.values(scores));
    const predictedCategory = maxScore > 0 
      ? Object.keys(scores).find(key => scores[key] === maxScore)
      : (ticket.category || 'general');

    // Enhanced confidence calculation
    let confidence = 0.1; // Base confidence
    
    if (maxScore > 0) {
      const bestMatch = detailedMatches[predictedCategory];
      const keywordDiversity = bestMatch.matchCount / this.keywordMappings[predictedCategory].length;
      const scoreIntensity = Math.min(maxScore / 10, 1); // Normalize high scores
      
      // Calculate confidence based on multiple factors
      confidence = Math.min(0.95, 
        0.2 +                           // Base confidence for any match
        (scoreIntensity * 0.4) +        // Score intensity factor
        (keywordDiversity * 0.3) +      // Keyword diversity factor
        (bestMatch.matchedKeywords.length > 3 ? 0.1 : 0) // Bonus for many matches
      );
      
      // Boost confidence if user-selected category matches prediction
      if (ticket.category === predictedCategory) {
        confidence = Math.min(0.95, confidence * 1.2);
      }
      
      // Boost confidence for title matches
      const titleWords = ticket.title.toLowerCase().split(' ');
      const titleMatches = titleWords.some(word => 
        this.keywordMappings[predictedCategory].some(keyword => 
          word.includes(keyword) || keyword.includes(word)
        )
      );
      if (titleMatches) {
        confidence = Math.min(0.95, confidence * 1.15);
      }
    }

    return {
      predictedCategory,
      confidence: Math.round(confidence * 100) / 100,
      reasons,
      scores,
      detailedMatches
    };
  }

  // Enhanced KB article retrieval
  async retrieveKBArticles(ticket, category) {
    try {
      const searchText = `${ticket.title} ${ticket.description}`.toLowerCase();
      const searchWords = searchText.split(/\s+/).filter(word => word.length > 2);
      
      // Get all published articles
      const allArticles = await Article.find({ status: 'published' });
      
      if (allArticles.length === 0) {
        return [];
      }

      // Score all articles for relevance
      const scoredArticles = allArticles.map(article => {
        const relevanceScore = this.calculateEnhancedRelevanceScore(searchText, searchWords, article, category);
        return {
          ...article.toObject(),
          relevanceScore,
          snippet: this.generateSnippet(article.body || article.content)
        };
      });

      // Return top scoring articles
      return scoredArticles
        .filter(article => article.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);

    } catch (error) {
      console.error('Error retrieving KB articles:', error);
      return [];
    }
  }

  // Enhanced relevance scoring
  calculateEnhancedRelevanceScore(searchText, searchWords, article, category) {
    const articleText = `${article.title} ${article.body || article.content || ''}`.toLowerCase();
    const articleTags = (article.tags || []).map(tag => tag.toLowerCase());
    
    let score = 0;

    // 1. Category/Tag matching (high weight)
    if (articleTags.includes(category)) {
      score += 10;
    }
    
    // 2. Title keyword matching (high weight)
    const titleText = article.title.toLowerCase();
    searchWords.forEach(word => {
      if (titleText.includes(word)) {
        score += 5;
      }
    });

    // 3. Content keyword matching (medium weight)
    searchWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\w*`, 'gi');
      const matches = articleText.match(regex);
      if (matches) {
        score += matches.length * 2;
      }
    });

    // 4. Tag keyword matching (medium weight)
    articleTags.forEach(tag => {
      if (searchText.includes(tag)) {
        score += 4;
      }
    });

    // 5. Category-specific keyword bonus
    if (this.keywordMappings[category]) {
      this.keywordMappings[category].forEach(keyword => {
        if (articleText.includes(keyword)) {
          score += 3;
        }
      });
    }

    return score;
  }

  // Extract meaningful keywords
  extractKeywords(text) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 15);
  }

  // Generate snippet from article body
  generateSnippet(body, maxLength = 250) {
    if (!body) return 'No content available.';
    if (body.length <= maxLength) return body;
    
    const truncated = body.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > -1 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }

  // Enhanced draft reply generation
  generateDraftReply(ticket, articles, category) {
    const citations = articles.slice(0, 3).map(article => article._id);
    
    let reply = `Thank you for contacting support regarding "${ticket.title}". `;
    
    // Category-specific greeting
    const categoryGreetings = {
      billing: "I can help you with your billing inquiry.",
      tech: "I can assist you with your technical issue.",
      shipping: "I can help you with your shipping question.",
      general: "I'm here to help with your request."
    };
    
    reply += (categoryGreetings[category] || categoryGreetings.general) + "\n\n";
    
    if (articles.length > 0) {
      reply += `Based on your description, I found some relevant information that should help:\n\n`;
      
      articles.slice(0, 3).forEach((article, index) => {
        reply += `**${index + 1}. ${article.title}**\n`;
        reply += `${article.snippet}\n\n`;
      });
      
      if (articles.length > 3) {
        reply += `I also found ${articles.length - 3} additional resources that might be helpful.\n\n`;
      }
      
      reply += `Please review these solutions. If they resolve your issue, you can close this ticket. Otherwise, our support team will provide additional assistance.\n\n`;
    } else {
      reply += `I understand you're experiencing an issue. Our support team will review your request and provide personalized assistance shortly.\n\n`;
    }
    
    reply += `If you need immediate assistance, please don't hesitate to reply with more details.\n\n`;
    reply += `Best regards,\nAI Support Assistant`;

    return {
      text: reply,
      citations
    };
  }
}

export default new AISuggestionService();