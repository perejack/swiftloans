import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbpbvoqfexofyxcexmmp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicGJ2b3FmZXhvZnl4Y2V4bW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDc0NTMsImV4cCI6MjA3NDkyMzQ1M30.hGn7ux2xnRxseYCjiZfCLchgOEwIlIAUkdS6h7byZqc';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};

    console.log('=== PayHero Webhook Received ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const responseCode = payload.ResponseCode !== undefined ? payload.ResponseCode : (payload.status === 'SUCCESS' ? 0 : 1);
    const responseDescription = payload.ResponseDescription || payload.message || '';
    const externalReference = payload.external_reference || payload.TransactionReference || payload.reference;
    const msisdn = payload.phone_number || payload.Msisdn || payload.phone;
    const receipt = payload.MpesaReceiptNumber || payload.TransactionReceipt || payload.provider_reference || null;

    let status = 'failed';
    if (responseCode === 0 || responseCode === '0' || payload.status === 'SUCCESS' || payload.status === 'COMPLETED' || payload.success === true) {
      status = 'success';
    } else if (responseCode === 1032 || responseCode === 1031 || responseCode === 1 || payload.status === 'CANCELLED') {
      status = 'cancelled';
    }

    let transaction = null;

    if (externalReference) {
      const result = await supabase
        .from('transactions')
        .select('*')
        .or(`reference.eq.${externalReference},transaction_request_id.eq.${externalReference}`)
        .maybeSingle();
      transaction = result.data;
    }

    if (!transaction && msisdn) {
      const result = await supabase
        .from('transactions')
        .select('*')
        .eq('phone', msisdn)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      transaction = result.data;
    }

    if (transaction) {
      console.log('Found transaction to update:', transaction.id);

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: status,
          result_code: String(responseCode),
          result_description: responseDescription,
          receipt_number: receipt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Database update error:', updateError);
      } else {
        console.log('Transaction updated successfully. Status:', status);
      }
    } else {
      console.log('No matching transaction found for webhook');
    }

    return res.status(200).json({
      status: 'success',
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Webhook received but processing failed',
      error: error.message || String(error)
    });
  }
};
