import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Calendar, TrendingUp, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoanCalculator = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(5000);
  const [months, setMonths] = useState(12);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [interestRate, setInterestRate] = useState(10);
  const [isHovered, setIsHovered] = useState(false);

  const calculateMonthlyPayment = () => {
    const monthlyRate = (interestRate / 100) / 12;
    const payment =
      (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    setMonthlyPayment(payment);
  };

  useEffect(() => {
    calculateMonthlyPayment();
  }, [amount, months, interestRate]);

  return (
    <motion.div
      className="p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
        >
          <TrendingUp className="w-6 h-6 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-bold">Loan Calculator</h3>
      </div>
      
      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-secondary-dark/80">
              Loan Amount
            </label>
            <motion.span
              key={amount}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-lg font-semibold text-primary"
            >
              ${amount.toLocaleString()}
            </motion.span>
          </div>
          <input
            type="range"
            min="1000"
            max="50000"
            step="100"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-secondary-dark/80">
              Loan Term
            </label>
            <motion.span
              key={months}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-lg font-semibold text-primary"
            >
              {months} months
            </motion.span>
          </div>
          <input
            type="range"
            min="6"
            max="60"
            step="6"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Monthly Payment</span>
              </div>
              <motion.span
                key={monthlyPayment}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="block text-3xl font-bold text-primary"
              >
                ${monthlyPayment.toFixed(2)}
              </motion.span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Total Payment</span>
              </div>
              <motion.span
                key={monthlyPayment * months}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="block text-2xl font-semibold text-secondary-dark"
              >
                ${(monthlyPayment * months).toFixed(2)}
              </motion.span>
            </div>
          </div>
        </motion.div>

        <motion.button 
          onClick={() => navigate('/apply')}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="relative btn btn-primary w-full text-lg group overflow-hidden"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.span
            initial={{ x: "100%" }}
            animate={{ x: isHovered ? "0%" : "100%" }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
          Apply Now
        </motion.button>
      </div>
    </motion.div>
  );
};

export default LoanCalculator;