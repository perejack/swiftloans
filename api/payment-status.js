import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clrfuyyxptssekmvbkvl.supabase.co';
// Use service role key on serverless functions for admin table access
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNscmZ1eXl4cHRzc2VrbXZia3ZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzQ4MzA0MCwiZXhwIjoyMTA5MDU5MDQwfQ.8jo38_WWuXHct12ZgEIVj0l8W3ui8s2e6VPjXzgWMQo';

const supabase = createClient(supabaseUrl, supabaseKey);

const PAYHERO_BASE_URL = 'https://backend.payhero.co.ke';
const PAYHERO_AUTH_HEADER = 'Basic aEttTWluZFhYbzBDWE9CTzJZd2c6d0VBUWFrd1NxWklWYjAyRFdJaHI1R095eFc4Tlg4Slk1OUk3bmFvMg==';

// Query PayHero payment status directly
async function queryPayHeroStatus(reference) {
  try {
    console.log(`Querying PayHero status for ${reference}`);
    
    const response = await fetch(`${PAYHERO_BASE_URL}/api/v2/transaction-status?reference=${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': PAYHERO_AUTH_HEADER
      }
    });

    if (!response.ok) {
      console.error('PayHero status response HTTP status:', response.status);
      const text = await response.text();
      console.error('PayHero status response:', text);
      return null;
    }

    const data = await response.json();
    console.log('PayHero status response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error querying PayHero status:', error.message);
    return null;
  }
}

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { reference } = req.query;
    
    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required'
      });
    }
    
    console.log('Checking status for reference:', reference);
    
    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .select('*')
      .or(`reference.eq.${reference},transaction_request_id.eq.${reference}`)
      .maybeSingle();
    
    if (dbError) {
      console.error('Database query error:', dbError);
    }
    
    let paymentStatus = 'PENDING';
    let currentAmount = 129;
    let currentPhone = '';
    let receiptNumber = null;
    let resultDesc = null;
    let resultCode = null;

    if (transaction) {
      currentAmount = transaction.amount || 129;
      currentPhone = transaction.phone || '';
      receiptNumber = transaction.receipt_number;
      resultDesc = transaction.result_description;
      resultCode = transaction.result_code;

      if (transaction.status === 'success') {
        paymentStatus = 'SUCCESS';
      } else if (transaction.status === 'failed' || transaction.status === 'cancelled') {
        paymentStatus = 'FAILED';
      }
    }

    // If still pending, query PayHero API
    if (paymentStatus === 'PENDING') {
      const payheroData = await queryPayHeroStatus(reference);
      
      if (payheroData) {
        const phStatus = (payheroData.status || '').toUpperCase();

        if (phStatus === 'SUCCESS' || phStatus === 'COMPLETED') {
          paymentStatus = 'SUCCESS';
          receiptNumber = payheroData.payment_reference || payheroData.provider_reference || payheroData.third_party_reference || payheroData.mpesa_reference || receiptNumber;
          resultDesc = payheroData.message || 'Payment successful';
          resultCode = '0';

          if (transaction) {
            await supabase
              .from('transactions')
              .update({
                status: 'success',
                receipt_number: receiptNumber,
                result_code: '0',
                result_description: resultDesc,
                updated_at: new Date().toISOString()
              })
              .eq('id', transaction.id);
          }
        } else if (phStatus === 'FAILED' || phStatus === 'CANCELLED') {
          paymentStatus = 'FAILED';
          resultDesc = payheroData.message || 'Payment failed or cancelled by user';
          resultCode = '1';
          
          if (transaction) {
            await supabase
              .from('transactions')
              .update({
                status: 'failed',
                result_code: '1',
                result_description: resultDesc,
                updated_at: new Date().toISOString()
              })
              .eq('id', transaction.id);
          }
        } else {
          // QUEUED, PENDING, PROCESSING — waiting for user to enter PIN on phone
          paymentStatus = 'PENDING';
          console.log(`Payment ${reference} is currently ${phStatus || 'PENDING'}, waiting for M-PESA PIN...`);
        }
      }
    }

    return res.status(200).json({
      success: true,
      payment: {
        status: paymentStatus,
        amount: currentAmount,
        phoneNumber: currentPhone,
        mpesaReceiptNumber: receiptNumber,
        resultDesc: resultDesc,
        resultCode: resultCode,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message || String(error)
    });
  }
};
