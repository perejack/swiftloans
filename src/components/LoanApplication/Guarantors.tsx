import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, ArrowRight, ArrowLeft } from 'lucide-react';

interface GuarantorsProps {
  onNext: () => void;
  onBack: () => void;
}

const Guarantors: React.FC<GuarantorsProps> = ({ onNext, onBack }) => {
  const [guarantors, setGuarantors] = useState([
    { name: '', phone: '', relationship: '' },
    { name: '', phone: '', relationship: '' }
  ]);

  const handleChange = (index: number, field: string, value: string) => {
    const newGuarantors = [...guarantors];
    newGuarantors[index] = { ...newGuarantors[index], [field]: value };
    setGuarantors(newGuarantors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const isFormValid = () => {
    return guarantors.every(g => 
      g.name.length >= 3 && 
      g.phone.length >= 10 && 
      g.relationship.length >= 3
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto p-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Guarantor Information</h2>
        <p className="text-gray-600">Please provide details of two guarantors</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {guarantors.map((guarantor, index) => (
          <div key={index} className="space-y-4 p-6 bg-white rounded-xl shadow-sm">
            <h3 className="font-medium text-lg">Guarantor {index + 1}</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={guarantor.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a8d46] focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={guarantor.phone}
                  onChange={(e) => handleChange(index, 'phone', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a8d46] focus:border-transparent"
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship
              </label>
              <select
                value={guarantor.relationship}
                onChange={(e) => handleChange(index, 'relationship', e.target.value)}
                className="block w-full py-3 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a8d46] focus:border-transparent"
                required
              >
                <option value="">Select relationship</option>
                <option value="Family">Family</option>
                <option value="Friend">Friend</option>
                <option value="Colleague">Colleague</option>
                <option value="Neighbor">Neighbor</option>
              </select>
            </div>
          </div>
        ))}

        <div className="space-y-4">
          <motion.button
            type="submit"
            disabled={!isFormValid()}
            className={`w-full bg-[#1a8d46] text-white p-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
              !isFormValid() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1a8d46]/90'
            }`}
            whileHover={isFormValid() ? { scale: 1.02 } : {}}
            whileTap={isFormValid() ? { scale: 0.98 } : {}}
          >
            Continue <ArrowRight className="w-5 h-5" />
          </motion.button>

          <button
            type="button"
            onClick={onBack}
            className="w-full text-gray-600 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Guarantors;
