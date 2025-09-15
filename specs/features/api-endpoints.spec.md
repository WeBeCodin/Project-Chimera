# API Endpoints Specification

## Overview
Comprehensive API documentation for Project Chimera's REST endpoints, following Supercharger Manifesto principles with streaming-first responses and multi-provider AI integration.

## Base Configuration

### API Base URL
- **Development**: `http://localhost:3000/api`
- **Staging**: `https://project-chimera-staging.vercel.app/api`
- **Production**: `https://project-chimera.vercel.app/api`

### Common Headers
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
X-User-ID: <user_identifier>
```

### Error Response Format
```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}
```

## Chat API Endpoints

### POST /api/chat
Primary streaming chat endpoint supporting multi-provider AI responses.

#### Request
```http
POST /api/chat
Content-Type: application/json

{
  "message": "What is the capital of France?",
  "conversationId": "conv_123",
  "model": "auto",
  "stream": true,
  "tools": ["web_search", "calculator"]
}
```

#### Request Schema
```typescript
interface ChatRequest {
  message: string;
  conversationId?: string;
  model?: 'auto' | 'groq-llama-70b' | 'groq-llama-8b' | 'gemini-flash';
  stream?: boolean;
  tools?: string[];
  context?: {
    ragEnabled?: boolean;
    maxTokens?: number;
    temperature?: number;
  };
}
```

#### Response (Streaming)
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type":"text-delta","textDelta":"The"}

data: {"type":"text-delta","textDelta":" capital"}

data: {"type":"text-delta","textDelta":" of"}

data: {"type":"text-delta","textDelta":" France"}

data: {"type":"text-delta","textDelta":" is"}

data: {"type":"text-delta","textDelta":" Paris"}

data: {"type":"finish","finishReason":"stop","usage":{"promptTokens":15,"completionTokens":6}}

data: [DONE]
```

#### Response Schema
```typescript
interface ChatStreamEvent {
  type: 'text-delta' | 'tool-call' | 'tool-result' | 'finish' | 'error';
  textDelta?: string;
  toolCall?: {
    id: string;
    name: string;
    parameters: Record<string, unknown>;
  };
  toolResult?: {
    id: string;
    result: unknown;
  };
  finishReason?: 'stop' | 'length' | 'tool-calls' | 'content-filter';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: {
    code: string;
    message: string;
  };
}
```

### GET /api/chat/conversations
Retrieve user's conversation history.

#### Request
```http
GET /api/chat/conversations?limit=20&offset=0&order=desc
```

#### Response
```json
{
  "conversations": [
    {
      "id": "conv_123",
      "title": "Discussion about Paris",
      "messageCount": 5,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:35:00Z",
      "preview": "What is the capital of France?"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### GET /api/chat/conversations/:id
Get specific conversation with message history.

#### Response
```json
{
  "conversation": {
    "id": "conv_123",
    "title": "Discussion about Paris",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  },
  "messages": [
    {
      "id": "msg_456",
      "role": "user",
      "content": "What is the capital of France?",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "msg_789",
      "role": "assistant",
      "content": "The capital of France is Paris.",
      "metadata": {
        "model": "groq-llama-70b",
        "provider": "groq",
        "tokens": 21,
        "duration": 1250
      },
      "createdAt": "2024-01-15T10:30:15Z"
    }
  ]
}
```

## Document Management API

### POST /api/documents
Upload and process documents for RAG pipeline.

#### Request (Multipart Form)
```http
POST /api/documents
Content-Type: multipart/form-data

--boundary123
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

[Binary file data]
--boundary123
Content-Disposition: form-data; name="metadata"

{
  "title": "Project Requirements",
  "tags": ["project", "requirements"],
  "private": true
}
--boundary123--
```

#### Response
```json
{
  "document": {
    "id": "doc_123",
    "title": "Project Requirements",
    "fileType": "pdf",
    "fileSize": 2048576,
    "status": "processing",
    "chunkCount": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "job": {
    "id": "job_456",
    "status": "queued",
    "progress": 0
  }
}
```

### GET /api/documents
List user's documents with pagination and filtering.

#### Request
```http
GET /api/documents?limit=20&offset=0&type=pdf&tag=project&search=requirements
```

#### Response
```json
{
  "documents": [
    {
      "id": "doc_123",
      "title": "Project Requirements",
      "fileType": "pdf",
      "fileSize": 2048576,
      "chunkCount": 25,
      "status": "ready",
      "tags": ["project", "requirements"],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:32:00Z"
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### GET /api/documents/:id
Get specific document details and chunks.

#### Response
```json
{
  "document": {
    "id": "doc_123",
    "title": "Project Requirements",
    "fileType": "pdf",
    "fileSize": 2048576,
    "status": "ready",
    "tags": ["project", "requirements"],
    "metadata": {
      "author": "John Doe",
      "createdDate": "2024-01-10T00:00:00Z",
      "pageCount": 15
    },
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "chunks": [
    {
      "id": "chunk_789",
      "content": "Project requirements overview...",
      "chunkIndex": 0,
      "tokenCount": 150,
      "metadata": {
        "startOffset": 0,
        "endOffset": 500,
        "pageNumber": 1
      }
    }
  ],
  "statistics": {
    "totalChunks": 25,
    "totalTokens": 4500,
    "avgTokensPerChunk": 180
  }
}
```

### POST /api/documents/search
Semantic search across user's documents.

#### Request
```json
{
  "query": "project timeline and milestones",
  "limit": 10,
  "threshold": 0.7,
  "filters": {
    "documentTypes": ["pdf", "docx"],
    "tags": ["project"],
    "dateRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-12-31T23:59:59Z"
    }
  }
}
```

#### Response
```json
{
  "results": [
    {
      "chunkId": "chunk_789",
      "documentId": "doc_123",
      "content": "The project timeline includes three major milestones...",
      "similarity": 0.89,
      "document": {
        "title": "Project Requirements",
        "fileType": "pdf"
      },
      "metadata": {
        "chunkIndex": 5,
        "pageNumber": 3
      }
    }
  ],
  "query": {
    "processed": "project timeline milestones",
    "embedding": "[0.1, 0.2, ...]",
    "executionTime": 125
  }
}
```

## Tool Orchestration API

### GET /api/tools
List available tools and their capabilities.

#### Response
```json
{
  "tools": [
    {
      "name": "web_search",
      "description": "Search the web for current information",
      "category": "search",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Search query"
          },
          "limit": {
            "type": "number",
            "description": "Maximum results",
            "default": 10
          }
        },
        "required": ["query"]
      },
      "metadata": {
        "version": "1.0.0",
        "permissions": ["web.search"],
        "timeout": 10000,
        "cacheable": true
      }
    }
  ]
}
```

### POST /api/tools/execute
Execute a tool with specified parameters.

#### Request
```json
{
  "tool": "web_search",
  "parameters": {
    "query": "latest AI developments 2024",
    "limit": 5
  },
  "context": {
    "conversationId": "conv_123",
    "previousResults": []
  }
}
```

#### Response
```json
{
  "result": {
    "success": true,
    "data": [
      {
        "title": "Latest AI Breakthroughs in 2024",
        "url": "https://example.com/ai-2024",
        "snippet": "Major developments in artificial intelligence...",
        "publishedAt": "2024-01-10T00:00:00Z"
      }
    ],
    "metadata": {
      "executionTime": 2500,
      "cacheHit": false,
      "provider": "search-api"
    }
  },
  "execution": {
    "id": "exec_456",
    "toolName": "web_search",
    "startedAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:30:02Z",
    "duration": 2500
  }
}
```

### POST /api/tools/orchestrate
Execute a complex workflow with multiple tools.

#### Request
```json
{
  "plan": {
    "steps": [
      {
        "id": "search",
        "tool": "web_search",
        "parameters": {
          "query": "{{input.query}}"
        },
        "dependsOn": []
      },
      {
        "id": "summarize",
        "tool": "text_summarization", 
        "parameters": {
          "text": "{{search.data}}"
        },
        "dependsOn": ["search"]
      }
    ]
  },
  "input": {
    "query": "AI trends 2024"
  },
  "context": {
    "conversationId": "conv_123"
  }
}
```

#### Response (Streaming)
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: {"type":"step-start","stepId":"search","tool":"web_search"}

data: {"type":"step-progress","stepId":"search","progress":50}

data: {"type":"step-complete","stepId":"search","result":{"success":true,"data":[...]}}

data: {"type":"step-start","stepId":"summarize","tool":"text_summarization"}

data: {"type":"step-complete","stepId":"summarize","result":{"success":true,"data":"Summary of AI trends..."}}

data: {"type":"orchestration-complete","executionTime":5200,"stepResults":{...}}

data: [DONE]
```

## Authentication API

### POST /api/auth/login
Authenticate user and return JWT token.

#### Request
```json
{
  "provider": "google",
  "token": "google_oauth_token",
  "redirectUrl": "http://localhost:3000/dashboard"
}
```

#### Response
```json
{
  "user": {
    "id": "user_123",
    "email": "john@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "plan": "free"
  },
  "session": {
    "token": "jwt_token_here",
    "expiresAt": "2024-01-16T10:30:00Z"
  }
}
```

### GET /api/auth/me
Get current user information.

#### Response
```json
{
  "user": {
    "id": "user_123",
    "email": "john@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "plan": "free",
    "usage": {
      "messagesThisMonth": 150,
      "documentsUploaded": 5,
      "toolsExecuted": 25
    }
  }
}
```

## System API

### GET /api/health
System health check endpoint.

#### Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 15,
      "connections": 3
    },
    "groq": {
      "status": "healthy",
      "responseTime": 120,
      "quotaRemaining": 85
    },
    "gemini": {
      "status": "healthy", 
      "responseTime": 200,
      "quotaRemaining": 92
    }
  },
  "version": "1.0.0"
}
```

### GET /api/metrics
System metrics for monitoring (admin only).

#### Response
```json
{
  "requests": {
    "total": 1500,
    "success": 1425,
    "errors": 75,
    "avgResponseTime": 250
  },
  "ai": {
    "groq": {
      "requests": 800,
      "tokens": 50000,
      "errors": 10
    },
    "gemini": {
      "requests": 200,
      "tokens": 15000,
      "errors": 5
    }
  },
  "database": {
    "queries": 2500,
    "avgQueryTime": 25,
    "connections": 8
  }
}
```

## Rate Limiting

### Rate Limit Headers
All API responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1642252800
X-RateLimit-Window: 3600
```

### Rate Limit Exceeded Response
```http
HTTP/1.1 429 Too Many Requests

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 15 minutes.",
    "details": {
      "limit": 100,
      "windowSeconds": 3600,
      "retryAfter": 900
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## WebSocket API

### Connection
```javascript
const ws = new WebSocket('wss://project-chimera.vercel.app/api/ws');
```

### Message Format
```json
{
  "type": "chat_message",
  "conversationId": "conv_123",
  "messageId": "msg_456",
  "content": "Hello world"
}
```

### Event Types
- `chat_message`: New message in conversation
- `typing_start`: User started typing
- `typing_stop`: User stopped typing  
- `presence_update`: User presence change
- `tool_execution`: Tool execution status update

## Testing Endpoints

### POST /api/test/echo
Echo endpoint for testing API connectivity.

#### Request
```json
{
  "message": "test",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Response
```json
{
  "echo": {
    "message": "test",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "server": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### GET /api/test/providers
Test AI provider connectivity and performance.

#### Response
```json
{
  "providers": {
    "groq": {
      "available": true,
      "latency": 120,
      "quotaRemaining": 85,
      "testQuery": "Test successful"
    },
    "gemini": {
      "available": true,
      "latency": 200,
      "quotaRemaining": 92,
      "testQuery": "Test successful"
    }
  }
}
```