// MongoDB Schemas for AI Training Data and Flexible Storage

// AI Training Data Collection
const aiTrainingSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["agentId", "sessionId", "timestamp", "data"],
      properties: {
        agentId: {
          bsonType: "string",
          description: "UUID of the AI agent"
        },
        sessionId: {
          bsonType: "string",
          description: "Training session identifier"
        },
        timestamp: {
          bsonType: "date",
          description: "When the training data was collected"
        },
        data: {
          bsonType: "object",
          properties: {
            input: {
              bsonType: "string",
              description: "Input prompt or context"
            },
            output: {
              bsonType: "string",
              description: "AI response"
            },
            feedback: {
              bsonType: "object",
              properties: {
                rating: {
                  bsonType: "number",
                  minimum: 0,
                  maximum: 5
                },
                successful: {
                  bsonType: "bool"
                },
                corrections: {
                  bsonType: "string"
                }
              }
            },
            context: {
              bsonType: "object",
              description: "Additional context data"
            },
            metrics: {
              bsonType: "object",
              properties: {
                responseTime: {
                  bsonType: "number"
                },
                tokensUsed: {
                  bsonType: "number"
                },
                confidence: {
                  bsonType: "number",
                  minimum: 0,
                  maximum: 1
                }
              }
            }
          }
        },
        tags: {
          bsonType: "array",
          items: {
            bsonType: "string"
          }
        }
      }
    }
  }
};

// Contract Templates Collection
const contractTemplateSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "category", "template", "createdBy"],
      properties: {
        name: {
          bsonType: "string",
          description: "Template name"
        },
        category: {
          bsonType: "string",
          enum: ["business", "personal", "ai_generated", "recursive", "experimental"]
        },
        template: {
          bsonType: "object",
          properties: {
            structure: {
              bsonType: "object"
            },
            requiredFields: {
              bsonType: "array"
            },
            defaultValues: {
              bsonType: "object"
            },
            validationRules: {
              bsonType: "object"
            }
          }
        },
        aiPrompts: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              role: {
                bsonType: "string"
              },
              prompt: {
                bsonType: "string"
              }
            }
          }
        },
        usageCount: {
          bsonType: "number",
          minimum: 0
        },
        successRate: {
          bsonType: "number",
          minimum: 0,
          maximum: 100
        },
        createdBy: {
          bsonType: "string"
        },
        createdAt: {
          bsonType: "date"
        },
        updatedAt: {
          bsonType: "date"
        }
      }
    }
  }
};

// Game Events Collection
const gameEventSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "eventType", "timestamp"],
      properties: {
        userId: {
          bsonType: "string",
          description: "UUID of the user"
        },
        eventType: {
          bsonType: "string",
          enum: ["contract_created", "contract_signed", "payment_received", "level_up", 
                 "achievement_unlocked", "ai_interaction", "dispute_raised", "game_completed"]
        },
        timestamp: {
          bsonType: "date"
        },
        eventData: {
          bsonType: "object",
          description: "Flexible event-specific data"
        },
        gameState: {
          bsonType: "object",
          properties: {
            level: { bsonType: "number" },
            balance: { bsonType: "number" },
            activeContracts: { bsonType: "number" },
            reputation: { bsonType: "number" }
          }
        },
        metadata: {
          bsonType: "object"
        }
      }
    }
  }
};

// Chat History Collection
const chatHistorySchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["conversationId", "participants", "messages"],
      properties: {
        conversationId: {
          bsonType: "string"
        },
        contractId: {
          bsonType: "string",
          description: "Related contract if applicable"
        },
        participants: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              id: { bsonType: "string" },
              type: { 
                bsonType: "string",
                enum: ["user", "ai_agent", "system"]
              },
              name: { bsonType: "string" }
            }
          }
        },
        messages: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              messageId: { bsonType: "string" },
              senderId: { bsonType: "string" },
              content: { bsonType: "string" },
              timestamp: { bsonType: "date" },
              edited: { bsonType: "bool" },
              attachments: { bsonType: "array" },
              reactions: { bsonType: "array" }
            }
          }
        },
        channel: {
          bsonType: "string",
          enum: ["discord", "telegram", "web", "api"]
        },
        status: {
          bsonType: "string",
          enum: ["active", "archived", "deleted"]
        },
        createdAt: {
          bsonType: "date"
        },
        lastActivity: {
          bsonType: "date"
        }
      }
    }
  }
};

// Analytics Data Collection
const analyticsSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["metric", "timestamp", "value"],
      properties: {
        metric: {
          bsonType: "string",
          enum: ["daily_active_users", "contracts_created", "total_transaction_volume",
                 "ai_interactions", "platform_revenue", "user_retention", "conversion_rate"]
        },
        timestamp: {
          bsonType: "date"
        },
        value: {
          bsonType: "number"
        },
        dimensions: {
          bsonType: "object",
          description: "Additional dimensions for segmentation"
        },
        aggregation: {
          bsonType: "string",
          enum: ["hourly", "daily", "weekly", "monthly"]
        }
      }
    }
  }
};

// Create collections with schemas
db.createCollection("ai_training_data", aiTrainingSchema);
db.createCollection("contract_templates", contractTemplateSchema);
db.createCollection("game_events", gameEventSchema);
db.createCollection("chat_history", chatHistorySchema);
db.createCollection("analytics", analyticsSchema);

// Create indexes
db.ai_training_data.createIndex({ "agentId": 1, "timestamp": -1 });
db.ai_training_data.createIndex({ "sessionId": 1 });
db.ai_training_data.createIndex({ "tags": 1 });

db.contract_templates.createIndex({ "category": 1, "usageCount": -1 });
db.contract_templates.createIndex({ "createdBy": 1 });

db.game_events.createIndex({ "userId": 1, "timestamp": -1 });
db.game_events.createIndex({ "eventType": 1, "timestamp": -1 });

db.chat_history.createIndex({ "conversationId": 1 });
db.chat_history.createIndex({ "contractId": 1 });
db.chat_history.createIndex({ "participants.id": 1 });

db.analytics.createIndex({ "metric": 1, "timestamp": -1 });
db.analytics.createIndex({ "aggregation": 1, "timestamp": -1 });