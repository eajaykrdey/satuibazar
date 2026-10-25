import { useEffect, useState } from 'react';
import { ShieldCheck, Store, User, X } from 'lucide-react';
import type {
  MarketplaceCategory,
  MarketplaceUser,
  UserRole,
  VendorShop,
} from '../../types/marketplace';
import { authenticateMarketplaceUser } from '../../utils/marketplaceLogic';

interface AuthModalProps {
  isOpen: boolean;
  initialRoleTab?: UserRole;
  initialMode?: 'login' | 'register';
  users: MarketplaceUser[];
  categories: MarketplaceCategory[];
  onClose: () => void;
  onLoginSuccess: (user: MarketplaceUser) => void;
  onRegisterCustomer: (newUser: MarketplaceUser) => void;
  onRegisterVendor: (newUser: MarketplaceUser, newShop: VendorShop) => void;
}

export function AuthModal({
  isOpen,
  initialRoleTab = 'customer',
  initialMode = 'login',
  users,
  categories,
  onClose,
  onLoginSuccess,
  onRegisterCustomer,
  onRegisterVendor,
}: AuthModalProps) {
  const [roleTab, setRoleTab] = useState<UserRole>(initialRoleTab);
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  // Shared Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPincode, setRegPincode] = useState('742405');

  // Vendor Onboarding extra fields
  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState(
    categories[0]?.name || 'Groceries & Fresh Produce'
  );
  const [shopDescription, setShopDescription] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [upiPayout, setUpiPayout] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRoleTab(initialRoleTab);
      setMode(initialRoleTab === 'admin' ? 'login' : initialMode);
      setFormError('');
      setIdentifier('');
      setPassword('');
    }
  }, [isOpen, initialRoleTab, initialMode]);

  if (!isOpen) return null;

  function handleRoleSwitch(nextRole: UserRole) {
    setRoleTab(nextRole);
    if (nextRole === 'admin') {
      setMode('login');
    }
    setFormError('');
    setIdentifier('');
    setPassword('');
  }

  function handleSignInSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = authenticateMarketplaceUser(users, roleTab, identifier, password);
    if (result.error || !result.user) {
      setFormError(result.error || 'Authentication failed.');
      return;
    }
    setFormError('');
    onLoginSuccess(result.user);
    onClose();
  }

  function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (regName.trim().length < 2) {
      setFormError('Please enter your full name (or contact person name).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!/^\d{10}$/.test(regPhone.replace(/\D/g, ''))) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (regPassword.trim().length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (regAddress.trim().length < 4 || !/^\d{6}$/.test(regPincode.trim())) {
      setFormError('Please provide a complete street address and 6-digit pincode.');
      return;
    }

    const duplicate = users.some(
      (u) =>
        u.email.toLowerCase() === regEmail.trim().toLowerCase() ||
        u.phone.replace(/\D/g, '') === regPhone.replace(/\D/g, '')
    );
    if (duplicate) {
      setFormError('An account with this email or mobile number already exists.');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (roleTab === 'customer') {
      const newCustomer: MarketplaceUser = {
        id: `usr-cust-${Date.now()}`,
        role: 'customer',
        fullName: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.replace(/\D/g, ''),
        password: regPassword,
        address: regAddress.trim(),
        pincode: regPincode.trim(),
        createdAt: today,
      };
      onRegisterCustomer(newCustomer);
      onClose();
      return;
    }

    if (roleTab === 'vendor') {
      if (shopName.trim().length < 3) {
        setFormError('Please enter your registered Shop / Business Name.');
        return;
      }
      if (
        bankHolder.trim().length < 2 ||
        bankAccount.replace(/\D/g, '').length < 6 ||
        bankIfsc.trim().length < 6
      ) {
        setFormError(
          'Please complete payout bank details (Account Holder, Account Number, and IFSC).'
        );
        return;
      }

      const newUserId = `usr-vendor-${Date.now()}`;
      const newShopId = `shop-${Date.now()}`;
      const last4 = bankAccount.replace(/\D/g, '').slice(-4);

      const newShop: VendorShop = {
        id: newShopId,
        name: shopName.trim(),
        ownerUserId: newUserId,
        contactPerson: regName.trim(),
        phone: regPhone.replace(/\D/g, ''),
        email: regEmail.trim().toLowerCase(),
        address: regAddress.trim(),
        pincode: regPincode.trim(),
        primaryCategory: shopCategory,
        description:
          shopDescription.trim() ||
          `Verified local ${shopCategory} seller serving Satuibazar customers.`,
        rating: 4.8,
        joinedAt: today,
        approvalStatus: 'pending',
        commissionRatePct: 8,
        bankDetails: {
          accountHolder: bankHolder.trim(),
          accountNumberMasked: `XXXX-XXXX-${last4}`,
          ifscCode: bankIfsc.trim().toUpperCase(),
          upiPayoutId: upiPayout.trim() || `${shopName.toLowerCase().replace(/\s+/g, '')}@upi`,
        },
      };

      const newVendorUser: MarketplaceUser = {
        id: newUserId,
        role: 'vendor',
        fullName: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.replace(/\D/g, ''),
        password: regPassword,
        address: regAddress.trim(),
        pincode: regPincode.trim(),
        shopId: newShopId,
        createdAt: today,
      };

      onRegisterVendor(newVendorUser, newShop);
      onClose();
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rbac-auth-modal-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2
              id="rbac-auth-modal-heading"
              className="font-display text-lg font-bold text-slate-900 sm:text-xl"
            >
              Satuibazar Role-Based Access Portal
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Strict tier isolation across Customer Accounts, Shop Owners, and Super Admin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* 3-Tier Role Selection Tabs */}
        <div
          role="tablist"
          aria-label="Select user role tier"
          className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={roleTab === 'customer'}
            onClick={() => handleRoleSwitch('customer')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              roleTab === 'customer'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Customer</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={roleTab === 'vendor'}
            onClick={() => handleRoleSwitch('vendor')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              roleTab === 'vendor'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Shop Owner</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={roleTab === 'admin'}
            onClick={() => handleRoleSwitch('admin')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              roleTab === 'admin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Admin</span>
          </button>
        </div>

        {/* Sign In vs Register Switcher (for Customer & Shop Owner) */}
        {roleTab !== 'admin' && (
          <div className="mt-4 flex items-center justify-between border-b border-slate-200 pb-3 text-xs">
            <span className="text-slate-500">
              {roleTab === 'customer'
                ? 'Access your private cart & order history'
                : 'Manage only your shop catalog, orders & payouts'}
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setFormError('');
                }}
                className={`rounded-md px-3 py-1 font-semibold cursor-pointer ${
                  mode === 'login'
                    ? 'bg-emerald-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setFormError('');
                }}
                className={`rounded-md px-3 py-1 font-semibold cursor-pointer ${
                  mode === 'register'
                    ? 'bg-emerald-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {roleTab === 'vendor' ? 'Register Shop' : 'Register'}
              </button>
            </div>
          </div>
        )}

        {formError && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
          >
            {formError}
          </p>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleSignInSubmit} noValidate className="mt-4 space-y-4">
            <div>
              <label htmlFor="auth-identifier" className="block text-xs font-semibold text-slate-700">
                Email Address or 10-Digit Mobile
              </label>
              <input
                id="auth-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  roleTab === 'customer'
                    ? 'subrata@satuibazar.in or 9832109876'
                    : roleTab === 'vendor'
                    ? 'ananya@bengalweaves.in'
                    : 'satuibazar@gmail.com'
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="h-10 w-full rounded-lg bg-emerald-900 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
            >
              Sign In as{' '}
              {roleTab === 'customer'
                ? 'Customer'
                : roleTab === 'vendor'
                ? 'Shop Owner'
                : 'Super Admin'}
            </button>

            {/* Quick Fill Demo Accounts for Evaluation */}
            <div className="border-t border-slate-200 pt-3.5 space-y-2">
              <p className="text-[11px] font-semibold text-slate-500">
                Quick-Fill Pre-Seeded {roleTab === 'customer' ? 'Customer' : roleTab === 'vendor' ? 'Vendor Shop' : 'Super Admin'} Accounts:
              </p>

              {roleTab === 'customer' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('subrata@satuibazar.in');
                      setPassword('customer123');
                      setFormError('');
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Subrata Mondal (Order #SB-MV-1041)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('priya@satuibazar.in');
                      setPassword('customer123');
                      setFormError('');
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Priya Sen (Order #SB-MV-1040)
                  </button>
                </div>
              )}

              {roleTab === 'vendor' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('ananya@bengalweaves.in');
                      setPassword('vendor123');
                      setFormError('');
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Bengal Weaves
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('faruq@expressgrocery.in');
                      setPassword('vendor123');
                      setFormError('');
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Express Fresh Grocery
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('debashis@satuielectro.in');
                      setPassword('vendor123');
                      setFormError('');
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Satui Electro &amp; Puja Bhandar
                  </button>
                </div>
              )}

              {roleTab === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('satuibazar@gmail.com');
                    setPassword('admin123');
                    setFormError('');
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Satuibazar Super Admin (satuibazar@gmail.com)
                </button>
              )}
            </div>
          </form>
        ) : (
          /* REGISTRATION & VENDOR ONBOARDING FORM */
          <form onSubmit={handleRegisterSubmit} noValidate className="mt-4 space-y-3.5">
            {roleTab === 'vendor' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="reg-shop-name" className="block text-xs font-semibold text-slate-700">
                    Shop / Business Name
                  </label>
                  <input
                    id="reg-shop-name"
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Khagra Heritage Looms"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="reg-shop-cat" className="block text-xs font-semibold text-slate-700">
                    Business Category
                  </label>
                  <select
                    id="reg-shop-cat"
                    value={shopCategory}
                    onChange={(e) => setShopCategory(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-fullname" className="block text-xs font-semibold text-slate-700">
                  {roleTab === 'vendor' ? 'Contact Person Name' : 'Full Name'}
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Arindam Ghosh"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700">
                  10-Digit Phone
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="9832001122"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 font-mono text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="arindam@example.com"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700">
                  Create Password (min 6 chars)
                </label>
                <input
                  id="reg-password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="reg-address" className="block text-xs font-semibold text-slate-700">
                  {roleTab === 'vendor' ? 'Shop Address / Location' : 'Delivery Address'}
                </label>
                <input
                  id="reg-address"
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Satui Chowrasta Main Road"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="reg-pincode" className="block text-xs font-semibold text-slate-700">
                  Pincode
                </label>
                <input
                  id="reg-pincode"
                  type="text"
                  value={regPincode}
                  onChange={(e) => setRegPincode(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 font-mono text-xs text-slate-900"
                />
              </div>
            </div>

            {roleTab === 'vendor' && (
              <div className="space-y-3 border-t border-slate-200 pt-3">
                <p className="text-xs font-semibold text-slate-800">
                  Bank &amp; UPI Settlement Details (for Vendor Payouts)
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="reg-bank-holder" className="block text-xs font-medium text-slate-600">
                      Bank Account Holder
                    </label>
                    <input
                      id="reg-bank-holder"
                      type="text"
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                      placeholder="Khagra Heritage Looms"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-bank-acc" className="block text-xs font-medium text-slate-600">
                      Bank Account Number
                    </label>
                    <input
                      id="reg-bank-acc"
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="309281746510"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-bank-ifsc" className="block text-xs font-medium text-slate-600">
                      IFSC Code
                    </label>
                    <input
                      id="reg-bank-ifsc"
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                      placeholder="SBIN0001842"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 font-mono text-xs uppercase"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-upi-payout" className="block text-xs font-medium text-slate-600">
                      UPI Payout ID (Optional)
                    </label>
                    <input
                      id="reg-upi-payout"
                      type="text"
                      value={upiPayout}
                      onChange={(e) => setUpiPayout(e.target.value)}
                      placeholder="khagralooms@sbi"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="h-10 w-full rounded-lg bg-emerald-900 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
            >
              {roleTab === 'vendor'
                ? 'Submit Shop Onboarding & Open Vendor Panel'
                : 'Create Customer Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
