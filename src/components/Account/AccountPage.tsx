import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Calendar, DollarSign, 
  Phone, Mail, ChevronRight, 
  Activity, Clock, CheckCircle,
  TrendingUp, Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationCenter } from './NotificationCenter';
import { WithdrawModal } from './WithdrawModal';
import { toast } from 'react-hot-toast';

interface UserProfile {
  auth_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  education: string;
  employment_status: string;
  monthly_income: number;
  account_balance: number;
}

interface LoanApplication {
  id: string;
  user_id: string;
  loan_amount: number;
  loan_purpose: string;
  repayment_period: number;
  savings_fee: number;
  status: string;
  created_at: string;
}

interface LoanRepayment {
  id: string;
  loan_id: string;
  amount: number;
  payment_date: string;
  transaction_id: string;
  status: string;
}

interface Notification {
  id: string;
  type: 'payment' | 'loan' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

type TabType = 'overview' | 'loans' | 'payments';

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  onClick?: () => void;
}> = ({ title, value, icon, gradient, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -5 }}
    whileTap={{ scale: 0.98 }}
    className={`relative overflow-hidden rounded-2xl shadow-lg cursor-pointer
      transition-all duration-300 group`}
    onClick={onClick}
  >
    <div className={`absolute inset-0 ${gradient} opacity-90`} />
    <div className="relative p-6 flex items-center space-x-4">
      <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-white/80">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
    </div>
    <motion.div
      className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"
      initial={false}
      transition={{ duration: 0.2 }}
    />
  </motion.div>
);

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [repayments, setRepayments] = useState<LoanRepayment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Loan Approved',
      message: 'Your loan application has been approved!',
      timestamp: new Date().toISOString(),
      type: 'loan',
      isRead: false,
    },
  ]);
  const [accountBalance, setAccountBalance] = useState(0);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile with account balance
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profile);
      setAccountBalance(profile.account_balance || 0);

      // Get loan applications
      const { data: loanData, error: loanError } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (loanError) throw loanError;
      setLoans(loanData || []);

      // Get loan repayments
      if (loanData && loanData.length > 0) {
        const { data: repaymentData, error: repaymentError } = await supabase
          .from('loan_repayments')
          .select('*')
          .in('loan_id', loanData.map(loan => loan.id))
          .order('payment_date', { ascending: false });

        if (repaymentError) throw repaymentError;
        setRepayments(repaymentData || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load account data');
    } finally {
      setLoading(false);
    }
  };

  const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.loan_amount, 0);
  const activeLoans = loans.filter(loan => loan.status === 'approved').length;
  const totalRepaid = repayments.reduce((sum, repayment) => sum + repayment.amount, 0);

  const handleWithdraw = async (amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_profiles')
        .update({ account_balance: profile!.account_balance - amount })
        .eq('auth_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        account_balance: prev.account_balance - amount
      } : null);

      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        title: 'Withdrawal Successful',
        message: `KES ${amount.toLocaleString()} has been sent to your M-PESA`,
        timestamp: new Date().toISOString(),
        type: 'payment' as const,
        isRead: false,
      }]);

      toast.success('Withdrawal successful! Funds sent to M-PESA.');
      setShowWithdraw(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process withdrawal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const renderOverview = () => (
    <>
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Loan Amount"
          value={`KES ${totalLoanAmount.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-r from-green-400 to-emerald-600"
        />
        <StatCard
          title="Active Loans"
          value={activeLoans.toString()}
          icon={<Activity className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-r from-blue-400 to-indigo-600"
        />
        <StatCard
          title="Total Repaid"
          value={`KES ${totalRepaid.toLocaleString()}`}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-r from-purple-400 to-pink-600"
        />
        <StatCard
          title="Credit Score"
          value="750"
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-r from-yellow-400 to-orange-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 -mt-4 sm:mt-0 relative z-10 mb-6">
        {[
          { icon: <DollarSign className="w-5 h-5" />, label: 'Apply Loan', color: 'text-emerald-600', gradient: 'from-emerald-50 to-green-100', onClick: () => navigate('/apply') },
          { icon: <Wallet className="w-5 h-5" />, label: 'Withdraw', color: 'text-blue-600', gradient: 'from-blue-50 to-indigo-100', onClick: () => setShowWithdraw(true) },
          { icon: <Activity className="w-5 h-5" />, label: 'History', color: 'text-purple-600', gradient: 'from-purple-50 to-pink-100' },
          { icon: <User className="w-5 h-5" />, label: 'Profile', color: 'text-orange-600', gradient: 'from-orange-50 to-yellow-100' },
        ].map((action) => (
          <motion.button
            key={action.label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.onClick}
            className={`flex flex-col items-center p-3 sm:p-4 rounded-xl bg-white shadow-sm
              hover:shadow-md transition-all duration-300 border border-gray-100`}
          >
            <div className={`${action.color} mb-1`}>{action.icon}</div>
            <span className="text-xs sm:text-sm font-medium text-gray-700">{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
      >
        <div className="relative h-32 bg-gradient-to-r from-green-400 to-emerald-600">
          <div className="absolute -bottom-10 left-6 w-24 h-24">
            <div className="w-full h-full rounded-2xl bg-white p-1">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="pt-12 pb-6 px-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="text-gray-600">Premium Member</p>
            </div>
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={(id) => {
                setNotifications(prev =>
                  prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                );
              }}
              onClearAll={() => setNotifications([])}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{profile?.phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Recent Activity
          </h3>
          <button className="text-green-500 hover:text-green-600 flex items-center text-sm font-medium">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="space-y-4">
          {loans.slice(0, 3).map((loan) => (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50
                hover:bg-gray-100 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl 
                  ${loan.status === 'approved' ? 'bg-green-100 text-green-600' :
                    loan.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'}`}>
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{loan.loan_purpose}</p>
                  <p className="text-sm text-gray-500">
                    KES {loan.loan_amount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-medium
                  ${loan.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'}`}>
                  {loan.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(loan.created_at).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );

  const renderLoans = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">All Loan Applications</h3>
        <div className="flex items-center space-x-2">
          <select 
            className="form-select rounded-lg border-gray-200 text-sm"
            defaultValue="all"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
              <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loans.map((loan) => (
              <motion.tr
                key={loan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="hover:bg-gray-50"
              >
                <td className="py-4">
                  <span className="font-medium">KES {loan.loan_amount.toLocaleString()}</span>
                </td>
                <td className="py-4 text-gray-500">{loan.loan_purpose}</td>
                <td className="py-4 text-gray-500">{loan.repayment_period} months</td>
                <td className="py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium
                    ${loan.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {loan.status}
                  </span>
                </td>
                <td className="py-4 text-gray-500">
                  {new Date(loan.created_at).toLocaleDateString()}
                </td>
                <td className="py-4">
                  <button className="text-blue-500 hover:text-blue-600">
                    View Details
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const renderPayments = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Paid"
          value={`KES ${totalRepaid.toLocaleString()}`}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-r from-green-400 to-emerald-600"
        />
        <StatCard
          title="Last Payment"
          value={repayments.length > 0 ? 
            `KES ${repayments[0].amount.toLocaleString()}` : 
            'No payments'
          }
          icon={<Clock className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-r from-blue-400 to-indigo-600"
        />
        <StatCard
          title="Payment Success Rate"
          value={`${repayments.filter(r => r.status === 'completed').length / Math.max(repayments.length, 1) * 100}%`}
          icon={<Activity className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-r from-purple-400 to-pink-600"
        />
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Payment History</h3>
          <div className="flex items-center space-x-2">
            <select 
              className="form-select rounded-lg border-gray-200 text-sm"
              defaultValue="all"
            >
              <option value="all">All Payments</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {repayments.map((payment) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="py-4">
                    <span className="font-mono text-sm">{payment.transaction_id}</span>
                  </td>
                  <td className="py-4">
                    <span className="font-medium">KES {payment.amount.toLocaleString()}</span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium
                      ${payment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-4 text-gray-500">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <button className="text-blue-500 hover:text-blue-600">
                      Download
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-green-400 to-emerald-600 text-white p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-8">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Welcome back!</h1>
              <p className="text-green-100 text-sm sm:text-base">Your financial journey starts here</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowWithdraw(true)}
              className="w-full sm:w-auto px-4 py-3 sm:px-6 sm:py-3 bg-white text-emerald-600 rounded-xl font-medium
                shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center sm:justify-start gap-2"
            >
              <Wallet className="w-5 h-5" />
              <span>Withdraw to M-PESA</span>
            </motion.button>
          </div>

          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 sm:mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-green-100 text-sm">Available Balance</p>
                <h2 className="text-3xl sm:text-4xl font-bold">
                  KES {accountBalance.toLocaleString()}
                </h2>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-50 px-2 pb-2 pt-1"
      >
        <div className="flex justify-around items-center">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors w-20
              ${activeTab === 'overview' ? 'text-green-600 bg-green-50' : 'text-gray-500'}`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors w-20
              ${activeTab === 'loans' ? 'text-green-600 bg-green-50' : 'text-gray-500'}`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Loans</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors w-20
              ${activeTab === 'payments' ? 'text-green-600 bg-green-50' : 'text-gray-500'}`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Payments</span>
          </button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-1 bg-white p-1 rounded-xl shadow-sm mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium capitalize
              ${activeTab === 'overview' ? 
                'bg-gradient-to-r from-green-400 to-emerald-600 text-white shadow-lg' : 
                'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            Overview
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('loans')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium capitalize
              ${activeTab === 'loans' ? 
                'bg-gradient-to-r from-green-400 to-emerald-600 text-white shadow-lg' : 
                'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            Loans
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('payments')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium capitalize
              ${activeTab === 'payments' ? 
                'bg-gradient-to-r from-green-400 to-emerald-600 text-white shadow-lg' : 
                'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            Payments
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'loans' && renderLoans()}
            {activeTab === 'payments' && renderPayments()}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        onWithdraw={handleWithdraw}
        maxAmount={accountBalance}
      />
    </div>
  );
};

export default AccountPage;
