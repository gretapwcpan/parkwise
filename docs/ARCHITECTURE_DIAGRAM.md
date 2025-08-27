# System Architecture Diagram

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React Frontend<br/>Port 3000] 
        B[Admin Dashboard<br/>Port 3002]
    end
    
    subgraph "API Gateway Layer"
        C[Node.js Backend<br/>Express + Socket.io<br/>Port 3001]
    end
    
    subgraph "AI Layer"
        D[Python LLM Service<br/>FastAPI + LangGraph<br/>Port 8001]
        E[MCP Server<br/>Model Context Protocol]
    end
    
    subgraph "External Services"
        F[OpenStreetMap<br/>Map Tiles]
        G[Firebase<br/>Firestore + FCM]
        H[LLM APIs<br/>OpenAI/Anthropic/Local]
    end
    
    subgraph "AI Assistants"
        I[Claude Desktop]
        J[ChatGPT]
        K[Other AI Assistants]
    end
    
    A --> C
    B --> C
    C --> D
    C --> F
    C --> G
    D --> H
    E --> C
    E --> D
    I --> E
    J --> E
    K --> E
```

## Detailed Component Architecture

```mermaid
graph LR
    subgraph "User Interfaces"
        UI1[Web App<br/>MapLibre GL JS<br/>Real-time Updates]
        UI2[Admin Panel<br/>Booking Management<br/>Analytics]
        UI3[Mobile PWA<br/>GPS Tracking<br/>Push Notifications]
    end
    
    subgraph "Backend Services"
        API[Express API Server]
        WS[WebSocket Handler<br/>Socket.io]
        AUTH[Authentication<br/>Middleware]
    end
    
    subgraph "Core Services"
        BOOK[Booking Service<br/>Conflict Prevention]
        LOC[Location Service<br/>Geocoding]
        NOTIF[Notification Service<br/>FCM Integration]
        PARKING[Parking Spot Service<br/>Availability Management]
    end
    
    subgraph "AI Services"
        NLP[Natural Language<br/>Processing]
        WORKFLOW[LangGraph Workflow<br/>Query → Filters]
        PARSER[Intent Parser<br/>Entity Extraction]
    end
    
    subgraph "Data Layer"
        DB[(Firebase Firestore<br/>or In-Memory)]
        CACHE[(Redis Cache<br/>Future)]
    end
    
    UI1 --> API
    UI2 --> API
    UI3 --> API
    
    API --> AUTH
    API --> WS
    API --> BOOK
    API --> LOC
    API --> NOTIF
    API --> PARKING
    
    BOOK --> DB
    LOC --> DB
    NOTIF --> DB
    PARKING --> DB
    
    API --> NLP
    NLP --> WORKFLOW
    WORKFLOW --> PARSER
```

## AI Integration Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant LLM_Service
    participant OpenAI
    
    User->>Frontend: "Find parking near Taipei 101 under $10"
    Frontend->>Backend: POST /api/locations/search/natural
    Backend->>LLM_Service: Forward query + user context
    LLM_Service->>OpenAI: Process natural language
    OpenAI-->>LLM_Service: Structured response
    LLM_Service->>LLM_Service: Parse into search filters
    LLM_Service-->>Backend: Return filters + explanation
    Backend->>Backend: Apply filters to parking data
    Backend-->>Frontend: Return matching spots
    Frontend-->>User: Display results on map
```

## MCP (Model Context Protocol) Integration

```mermaid
graph TB
    subgraph "AI Assistant Ecosystem"
        CLAUDE[Claude Desktop]
        CHATGPT[ChatGPT Plugins]
        CUSTOM[Custom AI Apps]
    end
    
    subgraph "MCP Layer"
        MCP_SERVER[MCP Server<br/>Protocol Handler]
        TOOLS[MCP Tools<br/>- searchParking<br/>- bookParking<br/>- getMyBookings<br/>- cancelBooking]
        RESOURCES[MCP Resources<br/>- userPreferences<br/>- bookingHistory<br/>- favoriteSpots]
    end
    
    subgraph "Application Layer"
        BACKEND[Node.js Backend]
        LLM_SVC[LLM Service]
    end
    
    CLAUDE --> MCP_SERVER
    CHATGPT --> MCP_SERVER
    CUSTOM --> MCP_SERVER
    
    MCP_SERVER --> TOOLS
    MCP_SERVER --> RESOURCES
    
    TOOLS --> BACKEND
    RESOURCES --> BACKEND
    BACKEND --> LLM_SVC
```

## Data Flow Architecture

```mermaid
graph TD
    subgraph "User Actions"
        SEARCH[Search Query]
        BOOK[Booking Request]
        LOCATION[GPS Update]
    end
    
    subgraph "Processing Pipeline"
        VALIDATE[Input Validation]
        PROCESS[Business Logic]
        PERSIST[Data Persistence]
    end
    
    subgraph "Real-time Updates"
        BROADCAST[WebSocket Broadcast]
        NOTIFY[Push Notifications]
        SYNC[State Synchronization]
    end
    
    subgraph "External Integrations"
        MAPS[OpenStreetMap API]
        FIREBASE[Firebase Services]
        AI_API[AI/LLM APIs]
    end
    
    SEARCH --> VALIDATE
    BOOK --> VALIDATE
    LOCATION --> VALIDATE
    
    VALIDATE --> PROCESS
    PROCESS --> PERSIST
    PROCESS --> AI_API
    PROCESS --> MAPS
    
    PERSIST --> FIREBASE
    PERSIST --> BROADCAST
    
    BROADCAST --> NOTIFY
    BROADCAST --> SYNC
```

## Technology Stack Layers

```mermaid
graph TB
    subgraph "Frontend Technologies"
        FE1[React 18.2.0<br/>Modern Hooks & Context]
        FE2[MapLibre GL JS<br/>Interactive Maps]
        FE3[Socket.io Client<br/>Real-time Updates]
        FE4[Axios<br/>HTTP Client]
    end
    
    subgraph "Backend Technologies"
        BE1[Node.js + Express<br/>REST API Server]
        BE2[Socket.io<br/>WebSocket Server]
        BE3[Firebase Admin<br/>Database & Auth]
        BE4[Helmet + CORS<br/>Security Middleware]
    end
    
    subgraph "AI Technologies"
        AI1[Python FastAPI<br/>High-performance API]
        AI2[LangChain + LangGraph<br/>AI Workflow Engine]
        AI3[Multiple LLM Support<br/>OpenAI/Anthropic/Local]
        AI4[Pydantic<br/>Data Validation]
    end
    
    subgraph "DevOps & Tools"
        DEV1[Turborepo<br/>Monorepo Build System]
        DEV2[Docker + Compose<br/>Containerization]
        DEV3[pnpm Workspaces<br/>Package Management]
        DEV4[Multiple Build Tools<br/>nx, npm, Make]
    end
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        DEV_FE[Frontend<br/>localhost:3000]
        DEV_BE[Backend<br/>localhost:3001]
        DEV_ADMIN[Admin<br/>localhost:3002]
        DEV_LLM[LLM Service<br/>localhost:8001]
    end
    
    subgraph "Build Tools"
        TURBO[Turborepo<br/>Caching & Parallelization]
        PNPM[pnpm<br/>Efficient Dependencies]
        DOCKER[Docker Compose<br/>Service Orchestration]
    end
    
    subgraph "Production Ready"
        PROD_WEB[Web Server<br/>Nginx/Apache]
        PROD_API[API Server<br/>PM2/Docker]
        PROD_DB[Database<br/>Firebase/MongoDB]
        PROD_CDN[CDN<br/>Static Assets]
    end
    
    DEV_FE --> TURBO
    DEV_BE --> TURBO
    DEV_ADMIN --> TURBO
    DEV_LLM --> DOCKER
    
    TURBO --> PROD_WEB
    DOCKER --> PROD_API
    PROD_API --> PROD_DB
    PROD_WEB --> PROD_CDN
```