# Parking MCP Server

This MCP (Model Context Protocol) server enables AI assistants to interact with the parking space booking system. It provides tools for searching, booking, and managing parking spots, as well as resources for accessing user preferences and history.

## Features

### Tools Available

1. **search_parking** - Search for available parking spots
   - Find spots by location, time, price, and features
   - Integrates with the LLM service for natural language processing

2. **book_parking** - Book a specific parking spot
   - Reserve parking for specified time periods
   - Include vehicle information

3. **get_my_bookings** - View current and upcoming bookings
   - Filter by status (active, upcoming, past, all)
   - See booking details and costs

4. **cancel_booking** - Cancel an existing booking
   - Provide cancellation reason
   - Handle refunds automatically

5. **modify_booking** - Modify an existing booking
   - Change time, duration, or parking spot
   - Calculate price differences

6. **get_parking_details** - Get detailed information about a parking spot
   - View features, pricing, availability
   - See ratings and reviews

### Resources Available

1. **parking://user/preferences** - User parking preferences
   - Preferred features and locations
   - Booking defaults and payment preferences

2. **parking://user/booking-history** - Historical booking data
   - Past bookings with statistics
   - Usage patterns and frequent locations

3. **parking://user/favorite-spots** - Saved favorite parking locations
   - Quick access to frequently used spots
   - Personalized recommendations

## Installation

1. Install dependencies:
```bash
cd mcp-server
npm install
```

2. Ensure the backend services are running:
   - Backend API (default: http://localhost:3000)
   - LLM Service (default: http://localhost:8001)

## Configuration

The server reads configuration from environment variables or uses defaults:

- `BACKEND_URL` - Backend API URL (default: http://localhost:3000)
- `LLM_SERVICE_URL` - LLM Service URL (default: http://localhost:8001)

You can also use the backend's `.env` file which is automatically loaded.

## Usage

### With Claude Desktop

1. Add to Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "parking": {
      "command": "node",
      "args": ["/path/to/parking-space-prototype/mcp-server/server.js"],
      "env": {
        "BACKEND_URL": "http://localhost:3000",
        "LLM_SERVICE_URL": "http://localhost:8001"
      }
    }
  }
}
```

2. Restart Claude Desktop

3. The parking tools will be available in your conversations

### Example Interactions

**Search for parking:**
```
"Find parking near Taipei 101 tomorrow at 2pm for 3 hours"
```

**Book a spot:**
```
"Book spot A-23 from 2pm to 5pm tomorrow"
```

**Check bookings:**
```
"Show me my upcoming parking bookings"
```

**Cancel a booking:**
```
"Cancel booking ID abc-123"
```

**Modify a booking:**
```
"Extend my booking abc-123 by 2 hours"
```

## Development

### Testing the Server

Run the server directly:
```bash
node server.js
```

The server communicates via stdio, so it needs to be connected to an MCP client to function properly.

### Adding New Tools

1. Create a new tool file in `tools/` directory
2. Export a function that handles the tool logic
3. Add the tool definition to `server.js`
4. Update the tool execution switch statement

### Adding New Resources

1. Create a new resource file in `resources/` directory
2. Export a function that returns the resource data
3. Add the resource definition to `server.js`
4. Update the resource reading switch statement

## Architecture

```
MCP Client (AI Assistant)
    ↓
MCP Server (this service)
    ↓
Backend Services
    ├── Backend API (Node.js/Express)
    └── LLM Service (Python/FastAPI)
```

## Authentication

Currently uses a placeholder authentication system. In production:
1. Implement OAuth2 flow for user consent
2. Map AI platform users to system users
3. Use secure token-based authentication

## Error Handling

The server includes comprehensive error handling:
- Network timeouts (10 seconds for API calls)
- Graceful fallbacks for service unavailability
- Detailed error messages for debugging
- User-friendly error responses

## Security Considerations

1. **API Keys**: Store securely in environment variables
2. **User Data**: Implement proper authentication before production
3. **Rate Limiting**: Add rate limiting for production use
4. **Input Validation**: All inputs are validated before processing
5. **Audit Logging**: Consider adding audit logs for all operations

## Troubleshooting

### Server won't start
- Check Node.js version (requires v14+)
- Verify all dependencies are installed
- Check for port conflicts

### Tools not working
- Ensure backend services are running
- Check network connectivity
- Verify API endpoints are correct
- Review server logs for errors

### Resources returning errors
- Check backend API availability
- Verify user authentication
- Review resource endpoint configuration

## Contributing

1. Follow the existing code structure
2. Add comprehensive error handling
3. Include JSDoc comments
4. Test with an MCP client before submitting

## License

MIT

## Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.
