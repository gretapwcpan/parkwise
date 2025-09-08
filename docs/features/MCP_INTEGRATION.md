# MCP (Model Context Protocol) Integration

## Overview

We have successfully integrated MCP (Model Context Protocol) into your parking space prototype. This enables AI assistants like Claude, ChatGPT, and others to directly interact with your parking system to search, book, and manage parking spots on behalf of users.

## What Was Built

### MCP Server Structure
```
mcp-server/
├── server.js                    # Main MCP server
├── package.json                 # Dependencies
├── README.md                    # Documentation
├── claude-config-example.json   # Configuration example
├── test-server.js              # Test script
├── verify-setup.js             # Verification script
├── tools/                      # Available tools for AI
│   ├── searchParking.js       # Search for parking spots
│   ├── bookParking.js         # Book a parking spot
│   ├── getMyBookings.js       # View bookings
│   ├── cancelBooking.js       # Cancel bookings
│   ├── modifyBooking.js       # Modify bookings
│   └── getParkingDetails.js   # Get spot details
└── resources/                  # Contextual resources
    ├── userPreferences.js      # User preferences
    ├── bookingHistory.js       # Booking history
    └── favoriteSpots.js        # Favorite locations
```

## Key Features

### 1. Natural Language Parking Search
AI assistants can understand queries like:
- "Find parking near Taipei 101 tomorrow at 2pm"
- "Show me covered parking with EV charging under $10/hour"
- "Find handicap accessible parking near the mall"

### 2. Automated Booking Management
- Book parking spots with specific time slots
- Modify existing bookings (extend time, change location)
- Cancel bookings with automatic refund handling
- View all upcoming and past bookings

### 3. Personalized Experience
- Access user's favorite parking spots
- Review booking history and patterns
- Use preferences for better recommendations
- Track spending and usage statistics

### 4. Detailed Information Access
- Get comprehensive parking spot details
- View pricing, features, and availability
- Check ratings and reviews
- Access operating hours and restrictions

## How It Works

### Architecture Flow
```
User → AI Assistant → MCP Protocol → MCP Server → Your Backend Services
                                                    ├── Backend API
                                                    └── LLM Service
```

### Integration Points
1. **Search Integration**: Uses your existing LLM service for natural language processing
2. **Booking System**: Connects to your backend booking API
3. **User Data**: Accesses preferences and history through backend endpoints
4. **Real-time Updates**: Reflects current availability and pricing

## Setup Instructions

### 1. Install Dependencies
```bash
cd mcp-server
npm install
```

### 2. Configure Claude Desktop
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "parking": {
      "command": "node",
      "args": ["/absolute/path/to/parking-space-prototype/mcp-server/server.js"],
      "env": {
        "BACKEND_URL": "http://localhost:3000",
        "LLM_SERVICE_URL": "http://localhost:8001"
      }
    }
  }
}
```

### 3. Start Backend Services
Ensure your backend services are running:
```bash
# Terminal 1: Backend API
cd backend
npm start

# Terminal 2: LLM Service
cd llm-service
python app.py
```

### 4. Restart Claude Desktop
After configuration, restart Claude Desktop to load the MCP server.

## Usage Examples

### Example 1: Search and Book
```
User: "Find parking near Taipei 101 for tomorrow 2pm for 3 hours"
AI: [Uses search_parking tool to find spots]
AI: "I found 5 parking spots near Taipei 101. The closest is..."
User: "Book spot A-23"
AI: [Uses book_parking tool]
AI: "✅ Parking booked! Spot A-23 from 2pm-5pm tomorrow. Total: $15"
```

### Example 2: Manage Bookings
```
User: "Show my upcoming bookings"
AI: [Uses get_my_bookings tool]
AI: "You have 2 upcoming bookings..."
User: "Cancel the one for Friday"
AI: [Uses cancel_booking tool]
AI: "✅ Booking cancelled. Refund of $12 will be processed."
```

### Example 3: Modify Booking
```
User: "Extend my current booking by 2 hours"
AI: [Uses modify_booking tool]
AI: "✅ Booking extended until 7pm. Additional charge: $10"
```

## Benefits

### For Users
- **Conversational Booking**: Book parking through natural conversation
- **Multi-Platform**: Works with any MCP-compatible AI assistant
- **Hands-Free**: Perfect for voice assistants while driving
- **Smart Assistance**: AI can suggest alternatives and handle complex requests

### For Your Platform
- **Increased Accessibility**: Users can book through their preferred AI assistant
- **Reduced Support Load**: AI handles common queries automatically
- **New User Acquisition**: Reach users through AI platforms
- **Future-Proof**: Ready for the AI-first future

## Security Considerations

### Current Implementation
- Uses placeholder authentication (`mcp-user-default`)
- Suitable for development and testing
- All operations are logged to stderr

### Production Requirements
1. **OAuth2 Authentication**: Implement proper user authentication
2. **API Key Management**: Secure storage of sensitive keys
3. **Rate Limiting**: Prevent abuse of the system
4. **Audit Logging**: Track all AI-initiated actions
5. **User Consent**: Clear permissions for AI actions

## Testing

### Verify Setup
```bash
cd mcp-server
node verify-setup.js
```

### Test Server
```bash
cd mcp-server
node test-server.js
```

## Next Steps

### Short Term
1. Test with Claude Desktop
2. Add more sophisticated error handling
3. Implement user authentication
4. Add rate limiting

### Medium Term
1. Create adapters for other AI platforms (ChatGPT, Gemini)
2. Add voice assistant integration
3. Implement booking recommendations
4. Add payment processing

### Long Term
1. Machine learning for personalized suggestions
2. Predictive availability forecasting
3. Dynamic pricing optimization
4. Multi-language support

## Troubleshooting

### MCP Server Not Connecting
- Verify all backend services are running
- Check the path in Claude configuration is absolute
- Ensure Node.js version is 14+
- Review Claude Desktop logs for errors

### Tools Not Working
- Check backend API is accessible at configured URL
- Verify LLM service is running
- Review server logs (stderr output)
- Test endpoints manually with curl

### Authentication Issues
- Currently uses placeholder auth
- Implement proper OAuth2 for production
- Map AI platform users to your system users

## Technical Details

### Tool Specifications
Each tool follows the MCP protocol with:
- Defined input schema (JSON Schema format)
- Structured output format
- Error handling and validation
- Timeout protection (10 seconds)

### Resource Specifications
Resources provide contextual data:
- JSON format for structured data
- Cached with fallback to defaults
- Read-only access
- User-scoped data

### Protocol Version
- MCP Protocol Version: 2024-11-05
- Compatible with Claude Desktop 1.0+
- Supports stdio transport

## Conclusion

Your parking system now has a powerful MCP integration that enables AI assistants to:
- Search for parking using natural language
- Book, modify, and cancel reservations
- Access user preferences and history
- Provide intelligent recommendations

This positions your platform at the forefront of AI-enabled parking solutions, ready for the future where users interact with services through AI assistants rather than traditional apps.
