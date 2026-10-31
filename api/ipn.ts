import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Allowed origins for CORS
const allowedOrigins = ['https://swiftloans.vercel.app', 'https://pay.pesapal.com'];

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Handle CORS
  const origin = request.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  if (request.method === 'POST') {
    try {
      const {
        OrderTrackingId,
        OrderMerchantReference,
        OrderNotificationType,
        OrderPaymentStatus,
        OrderPaymentStatusDescription,
        OrderPaymentMethod,
        OrderPaymentAccount,
        OrderAmount
      } = request.body;

      // Log the payment notification
      const { error } = await supabase
        .from('payment_notifications')
        .insert([
          {
            tracking_id: OrderTrackingId,
            merchant_reference: OrderMerchantReference,
            notification_type: OrderNotificationType,
            payment_status: OrderPaymentStatus,
            status_description: OrderPaymentStatusDescription,
            payment_method: OrderPaymentMethod,
            payment_account: OrderPaymentAccount,
            amount: OrderAmount
          }
        ]);

      if (error) {
        console.error('Error saving payment notification:', error);
        return response.status(500).json({ error: 'Failed to save payment notification' });
      }

      // If payment is successful, update user's activation status
      if (OrderPaymentStatus === 'COMPLETED') {
        // Update user's activation status in the database
        // You'll need to implement this based on your data structure
      }

      return response.status(200).json({ message: 'Notification processed successfully' });
    } catch (error) {
      console.error('Error processing IPN:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return response.status(405).json({ error: 'Method not allowed' });
  }
}
