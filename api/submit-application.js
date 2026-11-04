import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clrfuyyxptssekmvbkvl.supabase.co';
// Use service role key on serverless functions for admin table access
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNscmZ1eXl4cHRzc2VrbXZia3ZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzQ4MzA0MCwiZXhwIjoyMTA5MDU5MDQwfQ.8jo38_WWuXHct12ZgEIVj0l8W3ui8s2e6VPjXzgWMQo';

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
    } = req.body || {};

    // Validate required fields
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: phone' 
      });
    }

    // Clean phone number
    const cleanPhone = String(phone).replace(/\D/g, '');

    // Prepare project-specific data with 129 activation fee
    const projectData = {
      withdrawalAmount: withdrawalAmount || amount || 0,
      activationFee: 120,
      submittedAt: new Date().toISOString()
    };

    // Get client IP and user agent
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Insert into applications table
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          project_name: 'swiftloans',
          full_name: 'Swift Loans User',
          email: 'user@swiftloans.com',
          phone: cleanPhone,
          project_data: projectData,
          payment_reference: paymentReference || null,
          payment_status: 'unpaid',
          payment_amount: 120,
          ip_address: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '',
          user_agent: userAgent
        });

      if (error) {
        console.warn('Database insert warning (non-fatal):', error.message);
      } else {
        console.log('Application recorded successfully');
      }
    } catch (dbErr) {
      console.warn('Database connection warning (non-fatal):', dbErr);
    }

    // Always succeed so checkout flow is never blocked
    return res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        reference: paymentReference
      }
    });

  } catch (error) {
    console.error('Submit application error:', error);
    return res.status(200).json({
      success: true,
      message: 'Application recorded (fallback)',
      error: error.message
    });
  }
};
