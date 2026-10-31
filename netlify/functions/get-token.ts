import { Handler } from '@netlify/functions';
import axios from 'axios';

const PESAPAL_URL = 'https://pay.pesapal.com/v3';
const consumer_key = process.env.PESAPAL_CONSUMER_KEY;
const consumer_secret = process.env.PESAPAL_CONSUMER_SECRET;

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

  if (!consumer_key || !consumer_secret) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing Pesapal credentials' })
    };
  }

  try {
    console.log('Requesting token from PesaPal...');
    const response = await axios.post(
      `${PESAPAL_URL}/api/Auth/RequestToken`,
      {
        consumer_key,
        consumer_secret,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    console.log('Token response:', response.data);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error getting token:', error);
    const errorMessage = error.response?.data || error.message;
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: `Failed to get token: ${errorMessage}` })
    };
  }
};
