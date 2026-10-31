import { Handler } from '@netlify/functions';
import axios from 'axios';

const PESAPAL_URL = 'https://pay.pesapal.com/v3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { token, orderData } = JSON.parse(event.body || '{}');

    if (!token || !orderData) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing token or order data' })
      };
    }

    // First, register the IPN URL
    console.log('Registering IPN URL with PesaPal...');
    const ipnResponse = await axios.post(
      `${PESAPAL_URL}/api/URLSetup/RegisterIPN`,
      {
        url: orderData.callback_url,
        ipn_notification_type: "GET"
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      }
    );

    console.log('IPN registration response:', ipnResponse.data);

    if (!ipnResponse.data.ipn_id) {
      throw new Error(`IPN registration failed: No ipn_id in response - ${JSON.stringify(ipnResponse.data)}`);
    }

    // Update the order data with the IPN ID
    const updatedOrderData = {
      ...orderData,
      notification_id: ipnResponse.data.ipn_id // Changed from ipn_id to notification_id
    };

    console.log('Submitting order to PesaPal...', { updatedOrderData });
    const response = await axios.post(
      `${PESAPAL_URL}/api/Transactions/SubmitOrderRequest`,
      updatedOrderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      }
    );

    console.log('Order submission response:', response.data);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error submitting order:', error);
    const errorMessage = error.response?.data || error.message;
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: `Failed to submit order: ${errorMessage}` })
    };
  }
};
