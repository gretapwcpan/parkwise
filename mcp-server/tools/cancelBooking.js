import axios from 'axios';

/**
 * Cancel a parking booking
 * @param {Object} args - Tool arguments
 * @param {Object} config - Server configuration
 * @returns {Object} MCP response
 */
export async function cancelBookingTool(args, config) {
  const { BACKEND_URL } = config;
  const { bookingId, reason } = args;

  try {
    // Cancel the booking via backend API
    const response = await axios.delete(
      `${BACKEND_URL}/api/bookings/${bookingId}`,
      {
        data: {
          reason: reason || 'Cancelled via MCP',
        },
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const result = response.data;

    // Format success response
    let responseText = `✅ **Booking Successfully Cancelled**\n\n`;
    responseText += `📋 **Cancellation Details:**\n`;
    responseText += `• Booking ID: ${bookingId}\n`;
    
    if (result.spotName) {
      responseText += `• Parking Spot: ${result.spotName}\n`;
    }
    
    if (result.startTime) {
      responseText += `• Original Date: ${new Date(result.startTime).toLocaleDateString()}\n`;
      responseText += `• Original Time: ${new Date(result.startTime).toLocaleTimeString()}\n`;
    }
    
    if (result.refundAmount !== undefined) {
      responseText += `• Refund Amount: $${result.refundAmount.toFixed(2)}\n`;
    }
    
    if (result.cancellationFee !== undefined && result.cancellationFee > 0) {
      responseText += `• Cancellation Fee: $${result.cancellationFee.toFixed(2)}\n`;
    }
    
    if (reason) {
      responseText += `• Reason: ${reason}\n`;
    }
    
    responseText += `\n💳 Any applicable refunds will be processed within 3-5 business days.`;
    responseText += `\n📧 A cancellation confirmation has been sent to your email.`;

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
      metadata: {
        bookingId: bookingId,
        cancelled: true,
        refundAmount: result.refundAmount,
      },
    };

  } catch (error) {
    console.error('Cancel booking error:', error);

    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 404) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Booking not found. The booking ID "${bookingId}" does not exist or may have already been cancelled.`,
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
              text: `❌ Cannot cancel this booking: ${errorData.message || 'The booking may have already started or ended.'}`,
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
              text: `❌ You don't have permission to cancel this booking. Please verify the booking ID.`,
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
          text: `❌ Failed to cancel booking: ${error.message}. Please try again or contact support.`,
        },
      ],
      isError: true,
    };
  }
}
