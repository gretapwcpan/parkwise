# MCP Integration

AI assistants can interact with your parking system via Model Context Protocol.

## Features
- Natural language parking search
- Book/modify/cancel bookings
- Access user preferences
- Get parking details

## Setup
1. Install: `cd mcp-server && npm install`
2. Configure Claude Desktop:
```json
{
  "mcpServers": {
    "parking": {
      "command": "node",
      "args": ["/path/to/mcp-server/server.js"]
    }
  }
}
```
3. Start services: `cd backend && npm start`
4. Restart Claude Desktop

## Tools Available
- `searchParking` - Find spots
- `bookParking` - Make bookings
- `getMyBookings` - View bookings
- `cancelBooking` - Cancel bookings
- `getParkingDetails` - Spot info

## Example
"Find parking near Taipei 101 tomorrow 2pm"
→ AI searches and books automatically
