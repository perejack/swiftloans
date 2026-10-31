import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, FileText, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LoanApplication {
  id: string;
  loan_amount: number;
  loan_purpose: string;
  status: string;
  created_at: string;
}

interface UserData {
  full_name: string;
  phone_number: string;
  email: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get user's loan applications
      const { data: loans, error: loansError } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (loansError) throw loansError;

      setUserData(profile);
      setLoanApplications(loans || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      case 'in_progress':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <User className="w-6 h-6 text-[#FF6B00]" />
                My Profile
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-8">
                {error}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">{userData?.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span>{userData?.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>{userData?.email}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Loan Applications</h3>
                  <div className="space-y-3">
                    {loanApplications.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No loan applications yet
                      </p>
                    ) : (
                      loanApplications.map((loan) => (
                        <div
                          key={loan.id}
                          className="bg-white border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                KES {loan.loan_amount.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600">
                                {loan.loan_purpose}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(loan.status)}
                              <span className={`text-sm font-medium ${getStatusColor(loan.status)}`}>
                                {loan.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Applied on {new Date(loan.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserProfile;
