#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import tools
import { searchParkingTool } from './tools/searchParking.js';
import { bookParkingTool } from './tools/bookParking.js';
import { getMyBookingsTool } from './tools/getMyBookings.js';
import { cancelBookingTool } from './tools/cancelBooking.js';
import { modifyBookingTool } from './tools/modifyBooking.js';
import { getParkingDetailsTool } from './tools/getParkingDetails.js';

// Import resources
import { getUserPreferences } from './resources/userPreferences.js';
import { getBookingHistory } from './resources/bookingHistory.js';
import { getFavoriteSpots } from './resources/favoriteSpots.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../backend/.env') });

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:8001';

// Create server instance
const server = new Server(
  {
    name: 'parking-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Define available tools
const tools = [
  {
    name: 'search_parking',
    description: 'Search for available parking spots based on location, time, and preferences',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Address, landmark, or coordinates for parking search',
        },
        startTime: {
          type: 'string',
          description: 'ISO 8601 datetime when parking is needed',
        },
        duration: {
          type: 'number',
          description: 'Parking duration in hours',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price per hour (optional)',
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Required features like "EV charging", "covered", "handicap accessible" (optional)',
        },
        radius: {
          type: 'number',
          description: 'Search radius in meters (optional, default: 1000)',
        },
      },
      required: ['location', 'startTime', 'duration'],
    },
  },
  {
    name: 'book_parking',
    description: 'Book a specific parking spot',
    inputSchema: {
      type: 'object',
      properties: {
        spotId: {
          type: 'string',
          description: 'ID of the parking spot to book',
        },
        startTime: {
          type: 'string',
          description: 'ISO 8601 datetime for booking start',
        },
        endTime: {
          type: 'string',
          description: 'ISO 8601 datetime for booking end',
        },
        vehicleInfo: {
          type: 'object',
          properties: {
            licensePlate: { type: 'string' },
            vehicleType: { type: 'string' },
          },
          description: 'Vehicle information (optional)',
        },
      },
      required: ['spotId', 'startTime', 'endTime'],
    },
  },
  {
    name: 'get_my_bookings',
    description: 'Get current and upcoming parking bookings',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'upcoming', 'past', 'all'],
          description: 'Filter bookings by status (default: "upcoming")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of bookings to return (default: 10)',
        },
      },
    },
  },
  {
    name: 'cancel_booking',
    description: 'Cancel an existing parking booking',
    inputSchema: {
      type: 'object',
      properties: {
        bookingId: {
          type: 'string',
          description: 'ID of the booking to cancel',
        },
        reason: {
          type: 'string',
          description: 'Reason for cancellation (optional)',
        },
      },
      required: ['bookingId'],
    },
  },
  {
    name: 'modify_booking',
    description: 'Modify an existing parking booking',
    inputSchema: {
      type: 'object',
      properties: {
        bookingId: {
          type: 'string',
          description: 'ID of the booking to modify',
        },
        newStartTime: {
          type: 'string',
          description: 'New start time (ISO 8601)',
        },
        newEndTime: {
          type: 'string',
          description: 'New end time (ISO 8601)',
        },
        newSpotId: {
          type: 'string',
          description: 'Change to a different parking spot',
        },
      },
      required: ['bookingId'],
    },
  },
  {
    name: 'get_parking_details',
    description: 'Get detailed information about a specific parking spot',
    inputSchema: {
      type: 'object',
      properties: {
        spotId: {
          type: 'string',
          description: 'ID of the parking spot',
        },
      },
      required: ['spotId'],
    },
  },
];

// Define available resources
const resources = [
  {
    uri: 'parking://user/preferences',
    name: 'User Parking Preferences',
    description: 'User preferences for parking (favorite locations, preferred features)',
    mimeType: 'application/json',
  },
  {
    uri: 'parking://user/booking-history',
    name: 'Booking History',
    description: 'Historical parking bookings for the user',
    mimeType: 'application/json',
  },
  {
    uri: 'parking://user/favorite-spots',
    name: 'Favorite Parking Spots',
    description: 'User\'s saved favorite parking locations',
    mimeType: 'application/json',
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// Handle list resources request
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_parking':
        return await searchParkingTool(args, { BACKEND_URL, LLM_SERVICE_URL });
      
      case 'book_parking':
        return await bookParkingTool(args, { BACKEND_URL });
      
      case 'get_my_bookings':
        return await getMyBookingsTool(args, { BACKEND_URL });
      
      case 'cancel_booking':
        return await cancelBookingTool(args, { BACKEND_URL });
      
      case 'modify_booking':
        return await modifyBookingTool(args, { BACKEND_URL });
      
      case 'get_parking_details':
        return await getParkingDetailsTool(args, { BACKEND_URL });
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case 'parking://user/preferences':
        return await getUserPreferences({ BACKEND_URL });
      
      case 'parking://user/booking-history':
        return await getBookingHistory({ BACKEND_URL });
      
      case 'parking://user/favorite-spots':
        return await getFavoriteSpots({ BACKEND_URL });
      
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error) {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `Error reading resource: ${error.message}`,
        },
      ],
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Parking MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
