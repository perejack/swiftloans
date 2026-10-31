import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';

const LoanApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { amount = 5000, period = 1 } = location.state || {};

  const handleViewAccount = () => {
    navigate('/account');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="flex flex-col items-center">
          {/* Green circle with check icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Loan Approved!
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-center mb-8">
            Your loan has been approved and transferred to your account
          </p>

          {/* Loan Details */}
          <div className="w-full space-y-4 mb-8">
            <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-gray-900">KES {amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Repayment Period:</span>
              <span className="font-semibold text-gray-900">{period} Month{period > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* View Account Button */}
          <button
            onClick={handleViewAccount}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            View Account
            <span className="inline-block">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoanApprovalPage;
