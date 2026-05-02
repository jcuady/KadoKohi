import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store/authStore';
import {
  User,
  Mail,
  Shield,
  MapPin,
  Calendar,
  Pencil,
  Save,
  X,
  Coffee,
  Bell,
  Globe,
  Lock,
} from 'lucide-react';

export default function AccountProfile() {
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  if (!user) return null;

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setEditing(false);
  };

  const profileFields = [
    { icon: User, label: 'Full Name', value: user.name, editable: true },
    { icon: Mail, label: 'Email Address', value: user.email, editable: true },
    { icon: Shield, label: 'Account Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1), editable: false },
    { icon: MapPin, label: 'Preferred Branch', value: user.branchId ?? 'Not set', editable: false },
    { icon: Calendar, label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }), editable: false },
  ];

  const preferences = [
    { icon: Bell, label: 'Order Notifications', desc: 'Get notified when your order status changes', enabled: true },
    { icon: Coffee, label: 'Loyalty Rewards', desc: 'Earn stamps with every order you place', enabled: true },
    { icon: Globe, label: 'Marketing Emails', desc: 'Receive news about events and promotions', enabled: false },
  ];

  return (
    <div className="space-y-8">
      {/* ─── HEADER ─── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red mb-2">Account</p>
        <h1 className="font-display text-3xl md:text-4xl font-black text-kado-dark tracking-tight">
          Profile
        </h1>
        <p className="text-sm text-kado-dark/50 mt-1 font-medium">Manage your account details and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── PROFILE CARD ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-1"
        >
          <div className="rounded-2xl border border-kado-dark/8 bg-white p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-kado-dark text-white flex items-center justify-center font-display font-black text-3xl mx-auto mb-4 uppercase">
              {user.name.charAt(0)}
            </div>
            <h3 className="font-display font-black text-kado-dark text-xl mb-0.5">{user.name}</h3>
            <p className="text-xs text-kado-dark/40 font-medium mb-4">{user.email}</p>
            <span className="inline-flex items-center gap-1.5 bg-kado-red/10 text-kado-red px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
              <Shield className="w-3 h-3" />
              {user.role}
            </span>

            {user.loyaltyStamps !== undefined && (
              <div className="mt-6 pt-5 border-t border-kado-dark/5">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Coffee className="w-4 h-4 text-kado-red" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-kado-dark/40">Loyalty Stamps</span>
                </div>
                <p className="font-display text-3xl font-black text-kado-dark">{user.loyaltyStamps} <span className="text-kado-dark/20">/</span> 10</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ─── DETAILS + PREFERENCES ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="rounded-2xl border border-kado-dark/8 bg-white overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-kado-dark/5 bg-[#FAF7F2]">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-kado-dark">Account Details</h2>
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-kado-red hover:text-kado-dark transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setEditing(false); setName(user.name); setEmail(user.email); }}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-kado-dark/40 hover:text-kado-dark transition-colors"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-kado-dark/40 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-kado-dark/10 bg-white text-sm font-bold text-kado-dark focus:outline-none focus:border-kado-red/40 focus:ring-2 focus:ring-kado-red/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-kado-dark/40 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-kado-dark/10 bg-white text-sm font-bold text-kado-dark focus:outline-none focus:border-kado-red/40 focus:ring-2 focus:ring-kado-red/10 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-kado-dark text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-kado-red transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
                <p className="text-[10px] text-kado-dark/30 font-medium">
                  Changes are stored locally in mock mode. A real API will handle persistence.
                </p>
              </form>
            ) : (
              <div className="divide-y divide-kado-dark/5">
                {profileFields.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4 px-6 py-4 group">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] flex items-center justify-center shrink-0 group-hover:bg-kado-red/10 transition-colors">
                      <Icon className="w-4 h-4 text-kado-dark/40 group-hover:text-kado-red transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-kado-dark/35">{label}</p>
                      <p className="text-sm font-bold text-kado-dark truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="rounded-2xl border border-kado-dark/8 bg-white overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-kado-dark/5 bg-[#FAF7F2]">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-kado-dark">Preferences</h2>
            </div>
            <div className="divide-y divide-kado-dark/5">
              {preferences.map(({ icon: Icon, label, desc, enabled }) => (
                <div key={label} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-kado-dark/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-kado-dark">{label}</p>
                    <p className="text-xs text-kado-dark/40 font-medium">{desc}</p>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${
                      enabled ? 'bg-kado-red' : 'bg-kado-dark/15'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        enabled ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="rounded-2xl border border-kado-dark/8 bg-white overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-kado-dark/5 bg-[#FAF7F2]">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-kado-dark">Security</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-kado-dark/40" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-kado-dark">Password</p>
                  <p className="text-xs text-kado-dark/40 font-medium">Last changed: Never (mock mode)</p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-full border border-kado-dark/10 text-[10px] font-black uppercase tracking-widest text-kado-dark/50 hover:border-kado-red/30 hover:text-kado-red transition-all"
                >
                  Change
                </button>
              </div>
              <p className="text-[10px] text-kado-dark/30 mt-4 font-medium">
                Password management will be available when connected to a real authentication API.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
