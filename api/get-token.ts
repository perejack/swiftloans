import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const PESAPAL_URL = 'https://pay.pesapal.com/v3';
const consumer_key = process.env.PESAPAL_CONSUMER_KEY;
const consumer_secret = process.env.PESAPAL_CONSUMER_SECRET;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.writeHead(405, corsHeaders).end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!consumer_key || !consumer_secret) {
    console.error('Missing Pesapal credentials');
    res.writeHead(500, corsHeaders).end(JSON.stringify({ error: 'Missing Pesapal credentials' }));
    return;
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
    res.writeHead(200, corsHeaders).end(JSON.stringify(response.data));
  } catch (error) {
    console.error('Error getting token:', error);
    const errorMessage = error.response?.data || error.message;
    res.writeHead(500, corsHeaders).end(JSON.stringify({ error: `Failed to get token: ${errorMessage}` }));
  }
}
