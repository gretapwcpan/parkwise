import axios from 'axios';

/**
 * Book a parking spot
 * @param {Object} args - Tool arguments
 * @param {Object} config - Server configuration
 * @returns {Object} MCP response
 */
export async function bookParkingTool(args, config) {
  const { BACKEND_URL } = config;
  const { spotId, startTime, endTime, vehicleInfo } = args;

  try {
    // Validate time inputs
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      return {
        content: [
          {
            type: 'text',
            text: 'Invalid booking times: End time must be after start time.',
          },
        ],
        isError: true,
      };
    }

    if (start < new Date()) {
      return {
        content: [
          {
            type: 'text',
            text: 'Cannot book parking in the past. Please provide a future start time.',
          },
        ],
        isError: true,
      };
    }

    // Calculate duration in hours
    const durationHours = (end - start) / (1000 * 60 * 60);

    // Prepare booking request
    const bookingRequest = {
      locationId: spotId,
      startTime: startTime,
      endTime: endTime,
      duration: durationHours,
      vehicleInfo: vehicleInfo || {},
      // Note: In a real implementation, userId would come from authentication
      userId: 'mcp-user-' + Date.now(), // Temporary user ID
    };

    // Make booking request to backend
    const bookingResponse = await axios.post(
      `${BACKEND_URL}/api/bookings`,
      bookingRequest,
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const booking = bookingResponse.data;

    // Format success response
    let responseText = `✅ **Parking Successfully Booked!**\n\n`;
    responseText += `📋 **Booking Details:**\n`;
    responseText += `• Booking ID: ${booking.id || booking.bookingId}\n`;
    responseText += `• Spot: ${booking.spotName || spotId}\n`;
    responseText += `• Location: ${booking.address || 'See booking details'}\n`;
    responseText += `• Start: ${new Date(startTime).toLocaleString()}\n`;
    responseText += `• End: ${new Date(endTime).toLocaleString()}\n`;
    responseText += `• Duration: ${durationHours.toFixed(1)} hours\n`;
    
    if (booking.totalCost) {
      responseText += `• Total Cost: $${booking.totalCost.toFixed(2)}\n`;
    }

    if (booking.confirmationCode) {
      responseText += `• Confirmation Code: ${booking.confirmationCode}\n`;
    }

    if (vehicleInfo && vehicleInfo.licensePlate) {
      responseText += `• Vehicle: ${vehicleInfo.licensePlate}`;
      if (vehicleInfo.vehicleType) {
        responseText += ` (${vehicleInfo.vehicleType})`;
      }
      responseText += '\n';
    }

    responseText += `\n📱 You will receive a confirmation email and notification shortly.`;

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
      metadata: {
        bookingId: booking.id || booking.bookingId,
        booking: booking,
      },
    };

  } catch (error) {
    console.error('Book parking error:', error);

    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 409) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ This parking spot is not available for the requested time. ${errorData.message || 'Please try a different time or spot.'}`,
            },
          ],
          isError: true,
        };
      }

      if (status === 400) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Invalid booking request: ${errorData.message || 'Please check your booking details.'}`,
            },
          ],
          isError: true,
        };
      }

      if (status === 404) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Parking spot not found. The spot ID "${spotId}" does not exist.`,
            },
          ],
          isError: true,
        };
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `❌ Failed to book parking: ${error.message}. Please try again or contact support.`,
        },
      ],
      isError: true,
    };
  }
}
