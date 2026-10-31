import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';

const schema = z.object({
  employmentStatus: z.string().min(1, 'Please select employment status'),
  monthlyIncome: z.string().min(1, 'Monthly income is required'),
  purpose: z.string().min(1, 'Please select loan purpose'),
  existingLoans: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface AdditionalInfoProps {
  onNext: () => void;
  onBack: () => void;
}

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({ onNext, onBack }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(data);
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <h2 className="text-2xl font-semibold mb-6">Additional Information</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employment Status
          </label>
          <select {...register('employmentStatus')} className="input-field">
            <option value="">Select status</option>
            <option value="full-time">Full-time employed</option>
            <option value="part-time">Part-time employed</option>
            <option value="self-employed">Self-employed</option>
            <option value="unemployed">Unemployed</option>
          </select>
          {errors.employmentStatus && (
            <p className="mt-1 text-sm text-red-600">{errors.employmentStatus.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Income
          </label>
          <input
            {...register('monthlyIncome')}
            type="number"
            className="input-field"
            placeholder="5000"
          />
          {errors.monthlyIncome && (
            <p className="mt-1 text-sm text-red-600">{errors.monthlyIncome.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loan Purpose
          </label>
          <select {...register('purpose')} className="input-field">
            <option value="">Select purpose</option>
            <option value="debt-consolidation">Debt Consolidation</option>
            <option value="home-improvement">Home Improvement</option>
            <option value="business">Business</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
          {errors.purpose && (
            <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            {...register('existingLoans')}
            type="checkbox"
            className="w-4 h-4 text-primary"
          />
          <label className="text-sm text-gray-700">
            I have existing loans
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="btn w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full"
          >
            {isSubmitting ? 'Processing...' : 'Continue'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AdditionalInfo;