import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Coins,
  CreditCard,
  Smartphone,
  Building2,
  Zap,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  QrCode,
  Sparkles,
} from 'lucide-react';

const PACKAGES = [
  { amount: 500, price: 49, bonus: '', label: '500 Coins' },
  { amount: 1000, price: 99, bonus: '+100 Bonus', label: '1,000 Coins', popular: true },
  { amount: 2500, price: 249, bonus: '+300 Bonus', label: '2,500 Coins' },
  { amount: 5000, price: 449, bonus: '+750 Bonus', label: '5,000 Coins' },
  { amount: 10000, price: 899, bonus: '+2,000 Bonus', label: '10,000 Coins', vipBadge: 'VIP 2' },
  { amount: 50000, price: 3999, bonus: '+15,000 Bonus', label: '50,000 Coins', vipBadge: 'VIP 6' },
];

const PAYMENT_METHODS = [
  {
    id: 'UPI',
    name: 'UPI / Apps',
    desc: 'Google Pay, PhonePe, Paytm, BHIM',
    icon: Smartphone,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  {
    id: 'CARD',
    name: 'Debit / Credit Card',
    desc: 'Visa, MasterCard, RuPay',
    icon: CreditCard,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  },
  {
    id: 'NETBANKING',
    name: 'Net Banking',
    desc: 'HDFC, SBI, ICICI, Axis Bank',
    icon: Building2,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
  {
    id: 'RAZORPAY',
    name: 'Razorpay Instant',
    desc: 'Fast 1-click payment sandbox',
    icon: Zap,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
];

const TopUpModal = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState('SELECT_PACKAGE'); // 'SELECT_PACKAGE', 'PAYMENT_METHOD', 'DETAILS', 'PROCESSING', 'SUCCESS'
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[1]);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0].id);

  // Form Fields
  const [upiId, setUpiId] = useState('user@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 8920 1120 7843');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('321');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePackageSelect = (pkg) => {
    setSelectedPkg(pkg);
    setStep('PAYMENT_METHOD');
  };

  const handleProceedToPayment = () => {
    if (selectedMethod === 'RAZORPAY') {
      // Instant Razorpay flow
      executePayment();
    } else {
      setStep('DETAILS');
    }
  };

  const executePayment = async () => {
    try {
      setStep('PROCESSING');
      setError('');
      setProcessingStatus(`Connecting to ${selectedMethod} secure payment gateway...`);

      await new Promise((r) => setTimeout(r, 900));
      setProcessingStatus(`Authorizing payment of ₹${selectedPkg.price}...`);

      await new Promise((r) => setTimeout(r, 900));
      setProcessingStatus(`Adding ${selectedPkg.amount.toLocaleString()} coins to your PartyVibe wallet...`);

      // Call Backend Top-up API
      await api.post('/wallet/test-topup', {
        amount: selectedPkg.amount,
        paymentMethod: selectedMethod,
        price: selectedPkg.price,
        currency: 'INR',
        paymentReference: `PAY-${selectedMethod}-${Date.now().toString().slice(-6)}`,
      });

      await refreshUser();
      setStep('SUCCESS');
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed');
      setStep('PAYMENT_METHOD');
    }
  };

  const handleClose = () => {
    setStep('SELECT_PACKAGE');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-vibe-card border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl safe-area-bottom max-h-[92vh] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            {step !== 'SELECT_PACKAGE' && step !== 'PROCESSING' && step !== 'SUCCESS' && (
              <button
                onClick={() => setStep(step === 'DETAILS' ? 'PAYMENT_METHOD' : 'SELECT_PACKAGE')}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-7 h-7 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
              <Coins className="w-4 h-4 fill-yellow-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Coins Recharge</h3>
              <p className="text-[10px] text-gray-400">
                Current: {user?.coinsBalance?.toLocaleString() || 0} 🪙
              </p>
            </div>
          </div>

          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* STEP 1: Select Coin Package */}
        {step === 'SELECT_PACKAGE' && (
          <div className="mt-3 space-y-3">
            <div className="text-xs font-bold text-gray-300">Choose Coin Pack:</div>
            <div className="grid grid-cols-2 gap-2.5">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.amount}
                  onClick={() => handlePackageSelect(pkg)}
                  className={`relative flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                    pkg.popular
                      ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/15 to-amber-600/10 shadow-md hover:scale-[1.02]'
                      : 'border-white/5 bg-vibe-bg hover:border-white/20 hover:scale-[1.02]'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[9px] font-black px-2 py-0.2 rounded-full shadow">
                      HOT PACK
                    </span>
                  )}
                  {pkg.vipBadge && (
                    <span className="absolute -top-2 right-2 bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
                      {pkg.vipBadge}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xl">🪙</span>
                    <span className="text-sm font-black text-white">{pkg.amount.toLocaleString()}</span>
                  </div>

                  <span className="text-[10px] text-yellow-400 font-semibold">{pkg.bonus || 'Basic Pack'}</span>

                  <div className="mt-2 w-full pt-1.5 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-black text-white">₹{pkg.price}</span>
                    <span className="text-[10px] text-vibe-accent font-bold">Recharge</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Instant Free Dev Top-Up */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setSelectedPkg({ amount: 1000, price: 0, label: '1,000 Test Coins' });
                  setSelectedMethod('RAZORPAY');
                  executePayment();
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span>Quick Test: Add 1,000 Coins Free</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Choose Payment Method */}
        {step === 'PAYMENT_METHOD' && (
          <div className="mt-3 space-y-3">
            {/* Selected Pack Summary */}
            <div className="p-3 bg-vibe-bg rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-400">Selected: </span>
                <span className="text-xs font-extrabold text-white">
                  {selectedPkg.amount.toLocaleString()} Coins
                </span>
              </div>
              <div className="text-sm font-black text-yellow-400">
                Total: ₹{selectedPkg.price}
              </div>
            </div>

            <div className="text-xs font-bold text-gray-300">Select Payment Method:</div>

            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-vibe-accent bg-vibe-accent/15 shadow-md shadow-pink-500/10'
                        : 'border-white/5 bg-vibe-bg hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${method.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-extrabold text-white">{method.name}</div>
                        <div className="text-[10px] text-gray-400">{method.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleProceedToPayment}
              className="w-full mt-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-500/20 active:scale-[0.99] transition-all"
            >
              <span>Continue to Pay ₹{selectedPkg.price}</span>
            </button>
          </div>
        )}

        {/* STEP 3: Payment Details Form (UPI / Card / NetBanking) */}
        {step === 'DETAILS' && (
          <div className="mt-3 space-y-3.5">
            <div className="p-2.5 bg-vibe-bg rounded-xl border border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-400">Recharging:</span>
              <span className="font-extrabold text-white">
                {selectedPkg.amount.toLocaleString()} Coins (₹{selectedPkg.price})
              </span>
            </div>

            {/* UPI Form */}
            {selectedMethod === 'UPI' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Enter UPI ID (VPA):
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@okhdfcbank"
                    className="w-full bg-vibe-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                  <QrCode className="w-7 h-7 text-emerald-400 shrink-0" />
                  <div className="text-[11px] text-gray-300">
                    Scan via Google Pay, PhonePe, or Paytm on mobile to complete payment.
                  </div>
                </div>
              </div>
            )}

            {/* Card Form */}
            {selectedMethod === 'CARD' && (
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    Card Number:
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    maxLength={19}
                    className="w-full bg-vibe-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                      Expiry (MM/YY):
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      maxLength={5}
                      className="w-full bg-vibe-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">CVV:</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      maxLength={4}
                      className="w-full bg-vibe-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NetBanking Form */}
            {selectedMethod === 'NETBANKING' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-300">Select Bank:</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full bg-vibe-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  <option value="Punjab National Bank">Punjab National Bank</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 justify-center pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>256-Bit SSL Encrypted & RBI Safe Payment</span>
            </div>

            <button
              onClick={executePayment}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all"
            >
              <span>Authorize & Pay ₹{selectedPkg.price}</span>
            </button>
          </div>
        )}

        {/* STEP 4: Processing Animation */}
        {step === 'PROCESSING' && (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin shadow-lg" />
            <div>
              <h4 className="font-extrabold text-sm text-white">Processing Payment...</h4>
              <p className="text-xs text-gray-400 mt-1">{processingStatus}</p>
            </div>
          </div>
        )}

        {/* STEP 5: Success Confirmation */}
        {step === 'SUCCESS' && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="font-black text-base text-white">Recharge Successful!</h4>
              <p className="text-xs text-gray-300 mt-0.5">
                +{selectedPkg.amount.toLocaleString()} Coins added to your wallet
              </p>
            </div>

            <div className="p-3 bg-vibe-bg rounded-2xl border border-white/5 w-full text-xs space-y-1">
              <div className="flex justify-between text-gray-400">
                <span>Payment Mode:</span>
                <span className="font-bold text-white">{selectedMethod}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>New Wallet Balance:</span>
                <span className="font-black text-yellow-400">{user?.coinsBalance?.toLocaleString()} 🪙</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full mt-2 bg-gradient-to-r from-vibe-accent to-purple-600 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-md"
            >
              Done & Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopUpModal;
