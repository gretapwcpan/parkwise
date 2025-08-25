import axios from 'axios';

/**
 * Modify an existing parking booking
 * @param {Object} args - Tool arguments
 * @param {Object} config - Server configuration
 * @returns {Object} MCP response
 */
export async function modifyBookingTool(args, config) {
  const { BACKEND_URL } = config;
  const { bookingId, newStartTime, newEndTime, newSpotId } = args;

  try {
    // Validate that at least one modification is provided
    if (!newStartTime && !newEndTime && !newSpotId) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ No modifications specified. Please provide at least one of: newStartTime, newEndTime, or newSpotId.',
          },
        ],
        isError: true,
      };
    }

    // Validate time inputs if provided
    if (newStartTime && newEndTime) {
      const start = new Date(newStartTime);
      const end = new Date(newEndTime);
      
      if (start >= end) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Invalid booking times: End time must be after start time.',
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
              text: '❌ Cannot modify booking to a past time. Please provide a future start time.',
            },
          ],
          isError: true,
        };
      }
    }

    // Prepare modification request
    const modificationRequest = {};
    
    if (newStartTime) {
      modificationRequest.startTime = newStartTime;
    }
    
    if (newEndTime) {
      modificationRequest.endTime = newEndTime;
    }
    
    if (newSpotId) {
      modificationRequest.locationId = newSpotId;
    }

    // Calculate new duration if times are provided
    if (newStartTime && newEndTime) {
      const start = new Date(newStartTime);
      const end = new Date(newEndTime);
      modificationRequest.duration = (end - start) / (1000 * 60 * 60);
    }

    // Make modification request to backend
    const response = await axios.put(
      `${BACKEND_URL}/api/bookings/${bookingId}`,
      modificationRequest,
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const updatedBooking = response.data;

    // Format success response
    let responseText = `✅ **Booking Successfully Modified**\n\n`;
    responseText += `📋 **Updated Booking Details:**\n`;
    responseText += `• Booking ID: ${bookingId}\n`;
    
    if (updatedBooking.spotName || newSpotId) {
      responseText += `• Parking Spot: ${updatedBooking.spotName || newSpotId}`;
      if (newSpotId && updatedBooking.previousSpotName) {
        responseText += ` (changed from ${updatedBooking.previousSpotName})`;
      }
      responseText += '\n';
    }
    
    if (updatedBooking.address) {
      responseText += `• Location: ${updatedBooking.address}\n`;
    }
    
    if (newStartTime || updatedBooking.startTime) {
      const startTime = newStartTime || updatedBooking.startTime;
      responseText += `• New Start: ${new Date(startTime).toLocaleString()}`;
      if (updatedBooking.previousStartTime) {
        responseText += ` (was ${new Date(updatedBooking.previousStartTime).toLocaleString()})`;
      }
      responseText += '\n';
    }
    
    if (newEndTime || updatedBooking.endTime) {
      const endTime = newEndTime || updatedBooking.endTime;
      responseText += `• New End: ${new Date(endTime).toLocaleString()}`;
      if (updatedBooking.previousEndTime) {
        responseText += ` (was ${new Date(updatedBooking.previousEndTime).toLocaleString()})`;
      }
      responseText += '\n';
    }
    
    if (updatedBooking.duration) {
      responseText += `• Duration: ${updatedBooking.duration.toFixed(1)} hours\n`;
    }
    
    if (updatedBooking.totalCost !== undefined) {
      responseText += `• Updated Cost: $${updatedBooking.totalCost.toFixed(2)}`;
      if (updatedBooking.priceDifference !== undefined) {
        if (updatedBooking.priceDifference > 0) {
          responseText += ` (+$${updatedBooking.priceDifference.toFixed(2)})`;
        } else if (updatedBooking.priceDifference < 0) {
          responseText += ` (-$${Math.abs(updatedBooking.priceDifference).toFixed(2)})`;
        }
      }
      responseText += '\n';
    }
    
    if (updatedBooking.modificationFee !== undefined && updatedBooking.modificationFee > 0) {
      responseText += `• Modification Fee: $${updatedBooking.modificationFee.toFixed(2)}\n`;
    }
    
    responseText += `\n📧 A confirmation of your booking modification has been sent to your email.`;
    
    if (updatedBooking.priceDifference && updatedBooking.priceDifference !== 0) {
      if (updatedBooking.priceDifference > 0) {
        responseText += `\n💳 Additional charge of $${updatedBooking.priceDifference.toFixed(2)} will be processed.`;
      } else {
        responseText += `\n💳 Refund of $${Math.abs(updatedBooking.priceDifference).toFixed(2)} will be processed within 3-5 business days.`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
      metadata: {
        bookingId: bookingId,
        modified: true,
        updatedBooking: updatedBooking,
      },
    };

  } catch (error) {
    console.error('Modify booking error:', error);

    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 404) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Booking not found. The booking ID "${bookingId}" does not exist.`,
            },
          ],
          isError: true,
        };
      }

      if (status === 409) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Modification conflict: ${errorData.message || 'The requested time slot or parking spot is not available.'}`,
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
              text: `❌ Invalid modification: ${errorData.message || 'The booking cannot be modified. It may have already started or ended.'}`,
            },
          ],
          isError: true,
        };
      }

      if (status === 403) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ You don't have permission to modify this booking. Please verify the booking ID.`,
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
          text: `❌ Failed to modify booking: ${error.message}. Please try again or contact support.`,
        },
      ],
      isError: true,
    };
  }
}
