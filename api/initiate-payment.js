import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clrfuyyxptssekmvbkvl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNscmZ1eXl4cHRzc2VrbXZia3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0ODMwNDAsImV4cCI6MjEwOTA1OTA0MH0.1XVjn-U1ic3WAlLeI3o28D929JLTYNKWt8wBFdx9LGg';

const supabase = createClient(supabaseUrl, supabaseKey);

// PayHero Configuration
const PAYHERO_BASE_URL = 'https://backend.payhero.co.ke';
const PAYHERO_CHANNEL_ID = 14614;
const PAYHERO_AUTH_HEADER = 'Basic aEttTWluZFhYbzBDWE9CTzJZd2c6d0VBUWFrd1NxWklWYjAyRFdJaHI1R095eFc4Tlg4Slk1OUk3bmFvMg==';

function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  let normalized = phone.replace(/\s|-|\(|\)/g, '');
  
  if (normalized.startsWith('0')) {
    normalized = '254' + normalized.substring(1);
  } else if (normalized.startsWith('+254')) {
    normalized = normalized.substring(1);
  } else if (!normalized.startsWith('254')) {
    normalized = '254' + normalized;
  }
  
  if (normalized.length !== 12) {
    return null;
  }
  
  return normalized;
}

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    if (!req.body) {
      console.error('Request body is missing or empty');
      return res.status(400).json({ success: false, message: 'Request body is missing or invalid' });
    }
    
    let { 
      msisdn: phoneNumber, 
      phoneNumber: altPhoneNumber, 
      amount = 10, 
      description = 'PayHero Loan Activation Fee',
      reference: clientReference 
    } = req.body;
    phoneNumber = phoneNumber || altPhoneNumber;

    const reference = clientReference || `PAYHERO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    console.log('Parsed request:', { phoneNumber, amount, description, reference });

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format. Use 07XXXXXXXX or 254XXXXXXXXX' });
    }

    console.log('Making API request to PayHero:', `${PAYHERO_BASE_URL}/api/v2/payments`);

    const origin = req.headers.origin || 'https://swiftloans.vercel.app';
    const callback_url = `${origin}/api/payment-callback`;

    const payheroPayload = {
      amount: Number(amount) || 10,
      phone_number: normalizedPhone,
      channel_id: PAYHERO_CHANNEL_ID,
      provider: 'm-pesa',
      external_reference: reference,
      customer_name: 'Customer',
      callback_url: callback_url
    };

    const response = await fetch(`${PAYHERO_BASE_URL}/api/v2/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': PAYHERO_AUTH_HEADER
      },
      body: JSON.stringify(payheroPayload),
    });

    const responseText = await response.text();
    console.log('PayHero response status:', response.status);
    console.log('PayHero response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse PayHero response:', responseText);
      return res.status(502).json({
        success: false,
        message: 'Invalid response from PayHero payment service'
      });
    }

    if (data.success === true || response.status === 200 || response.status === 201 || data.status === 'QUEUED' || data.ResponseCode === '0') {
      const checkoutId = data.reference || data.CheckoutRequestID || data.data?.checkout_id || reference;
      
      try {
        const { error: dbError } = await supabase
          .from('transactions')
          .insert({
            transaction_request_id: checkoutId,
            status: 'pending',
            amount: Number(amount) || 10,
            phone: normalizedPhone,
            reference: reference,
          });

        if (dbError) {
          console.error('Database insert error:', dbError);
        } else {
          console.log('Transaction stored in database:', checkoutId);
        }
      } catch (dbErr) {
        console.error('Database error:', dbErr);
      }

      return res.status(200).json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          requestId: checkoutId,
          checkoutRequestId: checkoutId,
          transactionRequestId: checkoutId,
          reference: reference
        }
      });
    } else {
      console.error('PayHero error:', data);
      return res.status(400).json({
        success: false,
        message: data.message || data.error || 'Payment initiation failed',
        error: data
      });
    }
  } catch (error) {
    console.error('Global error in initiate-payment:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred',
      error: error.message || String(error)
    });
  }
};
