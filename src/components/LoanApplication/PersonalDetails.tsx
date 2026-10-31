import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Shield, Clock, AlertCircle, Smartphone, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const schema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  education: z.string().min(1, 'Education level is required'),
  employment: z.string().min(1, 'Employment status is required'),
  monthlyIncome: z.string().min(1, 'Monthly income is required')
});

type FormData = z.infer<typeof schema>;

interface PersonalDetailsProps {
  onNext: () => void;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({ onNext }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const applicationTips = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Provide accurate income details",
      description: "For better loan offers"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Quick processing",
      description: "2-minute approval"
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: "M-PESA Ready",
      description: "Instant disbursement"
    },
    {
      icon: <AlertCircle className="w-5 h-5" />,
      title: "Need help?",
      description: "24/7 support available"
    }
  ];

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    
    try {
      setIsLoading(true);

      // Save user profile data
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          auth_id: user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          date_of_birth: data.dateOfBirth,
          education: data.education,
          employment_status: data.employment,
          monthly_income: parseFloat(data.monthlyIncome),
          updated_at: new Date().toISOString()
        })
        .select();

      if (profileError) {
        throw profileError;
      }

      console.log('Form data:', data);
      onNext();
    } catch (error) {
      console.error('Error submitting form:', error);
      // Show error toast to the user
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Application Tips */}
      <div className="card bg-[#00B050]">
        <h3 className="text-lg font-semibold mb-4 text-white">Application Tips</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {applicationTips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="mt-1 text-[#00B050] transition-colors duration-300">
                {tip.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 group-hover:text-[#00B050] transition-colors duration-300">
                  {tip.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {tip.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Application Form */}
      <div className="card bg-white">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900">Complete Your Application</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label text-gray-700">First Name</label>
              <input
                {...register('firstName')}
                className={`input-field ${errors.firstName ? 'border-red-300' : ''}`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label text-gray-700">Last Name</label>
              <input
                {...register('lastName')}
                className={`input-field ${errors.lastName ? 'border-red-300' : ''}`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label text-gray-700">Email Address</label>
            <input
              {...register('email')}
              type="email"
              className={`input-field ${errors.email ? 'border-red-300' : ''}`}
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label text-gray-700">Phone Number</label>
            <input
              {...register('phone')}
              type="tel"
              className={`input-field ${errors.phone ? 'border-red-300' : ''}`}
              placeholder="07XX XXX XXX"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label text-gray-700">Date of Birth</label>
            <input
              {...register('dateOfBirth')}
              type="date"
              className={`input-field ${errors.dateOfBirth ? 'border-red-300' : ''}`}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label text-gray-700">Level of Education</label>
            <select 
              {...register('education')}
              className={`input-field ${errors.education ? 'border-red-300' : ''}`}
            >
              <option value="">Select education level</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="diploma">Diploma</option>
              <option value="degree">Bachelor's Degree</option>
              <option value="masters">Master's Degree</option>
            </select>
            {errors.education && (
              <p className="mt-1 text-sm text-red-600">{errors.education.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label text-gray-700">Employment Status</label>
            <select 
              {...register('employment')}
              className={`input-field ${errors.employment ? 'border-red-300' : ''}`}
            >
              <option value="">Select status</option>
              <option value="employed">Employed</option>
              <option value="self-employed">Self Employed</option>
              <option value="business">Business Owner</option>
              <option value="student">Student</option>
            </select>
            {errors.employment && (
              <p className="mt-1 text-sm text-red-600">{errors.employment.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label text-gray-700">Monthly Income (KES)</label>
            <select 
              {...register('monthlyIncome')}
              className={`input-field ${errors.monthlyIncome ? 'border-red-300' : ''}`}
            >
              <option value="">Select income range</option>
              <option value="0-30000">0 - 30,000</option>
              <option value="30001-50000">30,001 - 50,000</option>
              <option value="50001-100000">50,001 - 100,000</option>
              <option value="100001+">Above 100,000</option>
            </select>
            {errors.monthlyIncome && (
              <p className="mt-1 text-sm text-red-600">{errors.monthlyIncome.message}</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            className={`btn btn-primary w-full flex items-center justify-center gap-2 ${
              isLoading ? 'opacity-80 cursor-not-allowed' : ''
            }`}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue'
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

export default PersonalDetails;