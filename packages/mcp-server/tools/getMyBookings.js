import axios from 'axios';

/**
 * Get user's parking bookings
 * @param {Object} args - Tool arguments
 * @param {Object} config - Server configuration
 * @returns {Object} MCP response
 */
export async function getMyBookingsTool(args, config) {
  const { BACKEND_URL } = config;
  const { status = 'upcoming', limit = 10 } = args;

  try {
    // Note: In a real implementation, userId would come from authentication
    const userId = 'mcp-user-default'; // Temporary user ID

    // Fetch bookings from backend
    const response = await axios.get(
      `${BACKEND_URL}/api/bookings/user/${userId}`,
      {
        params: {
          status: status,
          limit: limit,
        },
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const bookings = response.data.bookings || [];

    if (bookings.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No ${status === 'all' ? '' : status} bookings found.`,
          },
        ],
      };
    }

    // Format the response
    let responseText = `📅 **Your ${status === 'all' ? '' : status.charAt(0).toUpperCase() + status.slice(1)} Bookings** (${bookings.length} found)\n\n`;

    bookings.forEach((booking, index) => {
      const startDate = new Date(booking.startTime);
      const endDate = new Date(booking.endTime);
      const now = new Date();
      
      // Determine booking status emoji
      let statusEmoji = '📅';
      if (booking.status === 'cancelled') {
        statusEmoji = '❌';
      } else if (startDate <= now && endDate >= now) {
        statusEmoji = '🚗';
      } else if (endDate < now) {
        statusEmoji = '✅';
      }

      responseText += `${index + 1}. ${statusEmoji} **${booking.spotName || booking.locationId}**\n`;
      responseText += `   • Booking ID: ${booking.id || booking.bookingId}\n`;
      responseText += `   • Date: ${startDate.toLocaleDateString()}\n`;
      responseText += `   • Time: ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}\n`;
      
      if (booking.address) {
        responseText += `   • Location: ${booking.address}\n`;
      }
      
      if (booking.totalCost) {
        responseText += `   • Cost: $${booking.totalCost.toFixed(2)}\n`;
      }
      
      if (booking.status) {
        responseText += `   • Status: ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}\n`;
      }
      
      if (booking.confirmationCode) {
        responseText += `   • Confirmation: ${booking.confirmationCode}\n`;
      }
      
      responseText += '\n';
    });

    // Add helpful actions based on status
    if (status === 'upcoming' && bookings.length > 0) {
      responseText += `💡 *Tip: You can modify or cancel upcoming bookings using their booking ID.*`;
    } else if (status === 'active' && bookings.length > 0) {
      responseText += `💡 *Tip: Need to extend your parking? Use the modify booking tool.*`;
    }

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
      metadata: {
        total_bookings: bookings.length,
        bookings: bookings,
      },
    };

  } catch (error) {
    console.error('Get bookings error:', error);

    if (error.response && error.response.status === 404) {
      return {
        content: [
          {
            type: 'text',
            text: 'No bookings found. Start by searching for and booking a parking spot!',
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Failed to retrieve bookings: ${error.message}. Please try again later.`,
        },
      ],
      isError: true,
    };
  }
}
