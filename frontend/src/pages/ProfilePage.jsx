import React, { useRef, useState } from "react";
import {
  User, Mail, Lock, Shield, CheckCircle, AlertCircle,
  Eye, EyeOff, Edit3, Save, X, LogOut,
  Globe, Phone, Building2, Camera,
  DollarSign, MapPin, Plus, Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const requirements = [
  { label: "8+ characters",       test: (p) => p.length >= 8 },
  { label: "Uppercase letter",     test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter",     test: (p) => /[a-z]/.test(p) },
  { label: "Number",               test: (p) => /[0-9]/.test(p) },
  { label: "Special character",    test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const OtpInput = ({ otp, onChange, onKeyDown }) => (
  <div className="flex justify-center gap-2.5">
    {otp.map((digit, i) => (
      <input key={i} id={`profile-otp-${i}`} type="text" inputMode="numeric"
        maxLength={1} value={digit}
        onChange={(e) => onChange(i, e.target.value)}
        onKeyDown={(e) => onKeyDown(i, e)}
        className="otp-cell" autoFocus={i === 0} />
    ))}
  </div>
);

const Err = ({ msg }) => msg
  ? <p className="mt-1.5 text-[11px] text-rust flex items-center gap-1"><AlertCircle className="w-3 h-3" />{msg}</p>
  : null;

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate      = useNavigate();
  const avatarRef     = useRef(null);

  const [editingUser,  setEditingUser]  = useState(false);
  const [newUsername,  setNewUsername]  = useState(user?.username || "");
  const [usernameErr,  setUsernameErr]  = useState("");
  const [userLoading,  setUserLoading]  = useState(false);

  const [editingInfo,  setEditingInfo]  = useState(false);
  const [infoForm,     setInfoForm]     = useState({ company: user?.company || "", country: user?.country || "", phone: user?.phone || "" });
  const [infoLoading,  setInfoLoading]  = useState(false);
  const [avatarLoading,setAvatarLoading]= useState(false);

  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency || "USD");
  const [currencyLoading, setCurrencyLoading] = useState(false);

  const [shippingProfiles, setShippingProfiles] = useState(user?.shippingProfiles || []);
  const [editingShipping, setEditingShipping] = useState(null);
  const [shippingForm, setShippingForm] = useState({
    name: "", fullName: "", company: "", address: "", city: "", country: "", postalCode: "", phone: "", isDefault: false
  });
  const [shippingLoading, setShippingLoading] = useState(false);

  const [pwStep,       setPwStep]       = useState(0);
  const [pwOtp,        setPwOtp]        = useState(["","","","","",""]);
  const [newPw,        setNewPw]        = useState("");
  const [confirmPw,    setConfirmPw]    = useState("");
  const [showPw,       setShowPw]       = useState(false);
  const [showCPw,      setShowCPw]      = useState(false);
  const [pwErrors,     setPwErrors]     = useState({});
  const [pwLoading,    setPwLoading]    = useState(false);
  const [resendCD,     setResendCD]     = useState(0);

  const handleLogout = async () => { await logout(); toast.success("Signed out"); navigate("/"); };

  const handleUsernameUpdate = async () => {
    if (!newUsername.trim()) { setUsernameErr("Username is required"); return; }
    if (newUsername.length < 3) { setUsernameErr("Minimum 3 characters"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) { setUsernameErr("Letters, numbers, underscores only"); return; }
    if (newUsername === user?.username) { setEditingUser(false); return; }
    setUserLoading(true);
    try {
      const { data } = await api.patch("/users/me/username", { username: newUsername });
      updateUser({ username: data.data.user.username });
      setEditingUser(false); toast.success("Username updated");
    } catch (err) { setUsernameErr(err.response?.data?.message || "Failed to update"); }
    finally { setUserLoading(false); }
  };

  const handleInfoUpdate = async () => {
    setInfoLoading(true);
    try {
      await api.patch("/users/me/profile", infoForm);
      updateUser(infoForm); setEditingInfo(false); toast.success("Profile updated");
    } catch { toast.error("Failed to update profile"); }
    finally { setInfoLoading(false); }
  };

  const handleRequestOtp = async () => {
    setPwLoading(true);
    try {
      await api.post("/users/me/request-password-change");
      setPwStep(1); setPwOtp(["","","","","",""]);
      toast.success(`Code sent to ${user?.email}`);
    } catch { toast.error("Failed to send code"); }
    finally { setPwLoading(false); }
  };

  const handleOtpChange = (i, v) => {
    if (!/^\d*$/.test(v)) return;
    const n = [...pwOtp]; n[i] = v.slice(-1); setPwOtp(n);
    if (v && i < 5) document.getElementById(`profile-otp-${i + 1}`)?.focus();
  };
  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !pwOtp[i] && i > 0) document.getElementById(`profile-otp-${i - 1}`)?.focus();
  };

  const handleChangePassword = async () => {
    const e = {};
    const code = pwOtp.join("");
    if (!newPw) e.password = "New password required";
    else { const f = requirements.filter((r) => !r.test(newPw)); if (f.length) e.password = f[0].label + " required"; }
    if (newPw !== confirmPw) e.confirm = "Passwords don't match";
    setPwErrors(e);
    if (Object.keys(e).length) return;
    setPwLoading(true);
    try {
      await api.patch("/users/me/change-password", { otp: code, password: newPw, confirmPassword: confirmPw });
      toast.success("Password changed successfully");
      setPwStep(0); setNewPw(""); setConfirmPw(""); setPwOtp(["","","","","",""]); setPwErrors({});
    } catch (err) { toast.error(err.response?.data?.message || "Failed to change password"); }
    finally { setPwLoading(false); }
  };

  const handleResend = async () => {
    if (resendCD > 0) return;
    try {
      await api.post("/auth/resend-otp", { email: user?.email, purpose: "password_change" });
      toast.success("New code sent"); setResendCD(60);
      const iv = setInterval(() => setResendCD((p) => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; }), 1000);
    } catch { toast.error("Failed to resend"); }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be 5 MB or smaller."); return; }
    setAvatarLoading(true);
    try {
      const fd = new FormData(); fd.append("avatar", file);
      const { data } = await api.patch("/users/me/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      updateUser({ avatar: data.data.user.avatar }); toast.success("Profile image updated");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to upload image"); }
    finally { setAvatarLoading(false); event.target.value = ""; }
  };

  const handleCurrencyUpdate = async () => {
    setCurrencyLoading(true);
    try {
      await api.patch("/users/me/preferred-currency", { preferredCurrency });
      updateUser({ preferredCurrency });
      toast.success("Preferred currency updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update currency");
    } finally {
      setCurrencyLoading(false);
    }
  };

  const handleAddShippingProfile = async () => {
    if (!shippingForm.name || !shippingForm.fullName || !shippingForm.address || !shippingForm.city || !shippingForm.country || !shippingForm.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    setShippingLoading(true);
    try {
      const { data } = await api.post("/users/me/shipping-profiles", shippingForm);
      setShippingProfiles(data.data.user.shippingProfiles);
      updateUser({ shippingProfiles: data.data.user.shippingProfiles });
      setShippingForm({ name: "", fullName: "", company: "", address: "", city: "", country: "", postalCode: "", phone: "", isDefault: false });
      toast.success("Shipping profile added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add shipping profile");
    } finally {
      setShippingLoading(false);
    }
  };

  const handleUpdateShippingProfile = async (profileId) => {
    setShippingLoading(true);
    try {
      const { data } = await api.patch(`/users/me/shipping-profiles/${profileId}`, shippingForm);
      setShippingProfiles(data.data.user.shippingProfiles);
      updateUser({ shippingProfiles: data.data.user.shippingProfiles });
      setEditingShipping(null);
      setShippingForm({ name: "", fullName: "", company: "", address: "", city: "", country: "", postalCode: "", phone: "", isDefault: false });
      toast.success("Shipping profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update shipping profile");
    } finally {
      setShippingLoading(false);
    }
  };

  const handleDeleteShippingProfile = async (profileId) => {
    if (!confirm("Are you sure you want to delete this shipping profile?")) return;
    try {
      const { data } = await api.delete(`/users/me/shipping-profiles/${profileId}`);
      setShippingProfiles(data.data.user.shippingProfiles);
      updateUser({ shippingProfiles: data.data.user.shippingProfiles });
      toast.success("Shipping profile deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete shipping profile");
    }
  };

  const startEditShipping = (profile) => {
    setEditingShipping(profile._id);
    setShippingForm({
      name: profile.name || "",
      fullName: profile.fullName || "",
      company: profile.company || "",
      address: profile.address || "",
      city: profile.city || "",
      country: profile.country || "",
      postalCode: profile.postalCode || "",
      phone: profile.phone || "",
      isDefault: profile.isDefault || false,
    });
  };

  const cancelEditShipping = () => {
    setEditingShipping(null);
    setShippingForm({ name: "", fullName: "", company: "", address: "", city: "", country: "", postalCode: "", phone: "", isDefault: false });
  };

  const Section = ({ title, icon: Icon, action, children }) => (
    <div className="card hover:shadow-card transition-shadow duration-300">
      <div className="flex items-center justify-between mb-5">
        <h3 className="flex items-center gap-2.5 text-espresso text-xl" style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
          <Icon className="w-4 h-4 text-tan" /> {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas pt-20">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
          <div>
            <p className="eyebrow mb-1">Account</p>
            <h1 className="text-espresso" style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.5rem', fontWeight: 400 }}>
              My Profile
            </h1>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-[13px] text-fog hover:text-rust transition-colors border border-border hover:border-rust/30 rounded-full px-4 py-2.5 bg-paper">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Avatar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card text-center hover:shadow-card transition-shadow">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-linen border-2 border-border flex items-center justify-center">
                  {user?.avatar
                    ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    : <span className="text-3xl text-sienna" style={{ fontFamily: '"Playfair Display", serif' }}>
                        {user?.username?.[0]?.toUpperCase()}
                      </span>}
                </div>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <button type="button" onClick={() => avatarRef.current?.click()} disabled={avatarLoading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-tan border-2 border-paper text-paper flex items-center justify-center hover:bg-sienna transition-colors disabled:opacity-50">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              {avatarLoading && <p className="text-[11px] text-tan mb-2">Uploading…</p>}
              <h3 className="text-espresso text-xl mb-1" style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>{user?.username}</h3>
              <p className="text-fog text-sm">{user?.email}</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <span className="badge-sage"><CheckCircle className="w-3 h-3" /> Verified</span>
                <span className="badge-tan">{user?.role === "admin" ? "Admin" : "Buyer"}</span>
              </div>
              {user?.lastLogin && (
                <p className="text-fog/50 text-[10px] mt-4">Last login: {new Date(user.lastLogin).toLocaleDateString()}</p>
              )}
            </div>

            <div className="card hover:shadow-card transition-shadow">
              <h4 className="flex items-center gap-2 text-[11px] tracking-widest uppercase text-fog font-medium mb-4">
                <Shield className="w-3.5 h-3.5 text-tan/70" /> Account Status
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-fog text-xs">Email</span>
                  <span className="text-sage text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-fog text-xs">Member since</span>
                  <span className="text-espresso/70 text-xs">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Forms */}
          <div className="lg:col-span-2 space-y-5">

            {/* Username */}
            <Section title="Username" icon={User}
              action={!editingUser
                ? <button onClick={() => { setEditingUser(true); setNewUsername(user?.username || ""); }} className="btn-ghost text-[13px]"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                : <button onClick={() => { setEditingUser(false); setUsernameErr(""); }} className="btn-ghost text-[13px]"><X className="w-3.5 h-3.5" /> Cancel</button>
              }>
              {editingUser ? (
                <div className="space-y-3">
                  <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fog/60" />
                    <input value={newUsername} onChange={(e) => { setNewUsername(e.target.value); setUsernameErr(""); }}
                      className={`field pl-11 ${usernameErr ? "field-error" : ""}`} placeholder="New username" autoFocus />
                  </div>
                  <Err msg={usernameErr} />
                  <button onClick={handleUsernameUpdate} disabled={userLoading} className="btn-primary w-full justify-center text-[13px] py-3">
                    {userLoading ? "Saving…" : <><Save className="w-3.5 h-3.5" /> Save Username</>}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-linen border border-border rounded-xl px-4 py-3">
                  <User className="w-4 h-4 text-fog/60" />
                  <span className="text-espresso text-sm">{user?.username}</span>
                </div>
              )}
            </Section>

            {/* Email */}
            <Section title="Email Address" icon={Mail}>
              <div className="flex items-center gap-3 bg-linen border border-border rounded-xl px-4 py-3">
                <Mail className="w-4 h-4 text-fog/60" />
                <span className="text-espresso/80 text-sm flex-1">{user?.email}</span>
                <CheckCircle className="w-4 h-4 text-sage flex-shrink-0" />
              </div>
              <p className="text-fog/50 text-[11px] mt-2">Email cannot be changed for security reasons.</p>
            </Section>

            {/* Business Info */}
            <Section title="Business Info" icon={Globe}
              action={!editingInfo
                ? <button onClick={() => setEditingInfo(true)} className="btn-ghost text-[13px]"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                : <button onClick={() => setEditingInfo(false)} className="btn-ghost text-[13px]"><X className="w-3.5 h-3.5" /> Cancel</button>
              }>
              {editingInfo ? (
                <div className="space-y-3">
                  {[
                    { name: "company", label: "Company Name",  icon: Building2, placeholder: "Your company" },
                    { name: "country", label: "Country",       icon: Globe,     placeholder: "e.g. United States" },
                    { name: "phone",   label: "Phone Number",  icon: Phone,     placeholder: "+1 234 567 8900" },
                  ].map(({ name, label, icon: Icon, placeholder }) => (
                    <div key={name}>
                      <label className="block text-[10px] uppercase tracking-widest text-fog font-medium mb-1.5">{label}</label>
                      <div className="relative"><Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fog/60" />
                        <input value={infoForm[name]}
                          onChange={(e) => setInfoForm((p) => ({ ...p, [name]: e.target.value }))}
                          className="field pl-11" placeholder={placeholder} />
                      </div>
                    </div>
                  ))}
                  <button onClick={handleInfoUpdate} disabled={infoLoading} className="btn-primary w-full justify-center text-[13px] py-3">
                    {infoLoading ? "Saving…" : <><Save className="w-3.5 h-3.5" /> Save Info</>}
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { label: "Company", value: user?.company, icon: Building2 },
                    { label: "Country", value: user?.country, icon: Globe },
                    { label: "Phone",   value: user?.phone,   icon: Phone },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-3 bg-linen border border-border rounded-xl px-4 py-3">
                      <Icon className="w-4 h-4 text-fog/60 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-fog/60">{label}</p>
                        <p className={value ? "text-espresso text-sm mt-0.5" : "text-fog/40 text-sm italic mt-0.5"}>{value || "Not provided"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Preferred Currency */}
            <Section title="Preferred Currency" icon={DollarSign}>
              <div className="space-y-3">
                <p className="text-fog text-sm">Select your preferred currency for pricing display and quotes.</p>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="field"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="CNY">CNY - Chinese Yuan</option>
                </select>
                <button
                  onClick={handleCurrencyUpdate}
                  disabled={currencyLoading || preferredCurrency === user?.preferredCurrency}
                  className="btn-primary w-full justify-center text-[13px] py-3"
                >
                  {currencyLoading ? "Saving…" : <><Save className="w-3.5 h-3.5" /> Save Currency</>}
                </button>
              </div>
            </Section>

            {/* Shipping Profiles */}
            <Section title="Shipping Profiles" icon={MapPin}
              action={<button onClick={() => setEditingShipping("new")} className="btn-ghost text-[13px]"><Plus className="w-3.5 h-3.5" /> Add Profile</button>}
            >
              {editingShipping && (
                <div className="space-y-4 mb-6 p-4 bg-linen/50 border border-border rounded-xl">
                  <h4 className="text-espresso font-medium">{editingShipping === "new" ? "Add Shipping Profile" : "Edit Shipping Profile"}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={shippingForm.name}
                      onChange={(e) => setShippingForm(p => ({ ...p, name: e.target.value }))}
                      className="field"
                      placeholder="Profile name (e.g. Office, Warehouse)"
                    />
                    <input
                      value={shippingForm.fullName}
                      onChange={(e) => setShippingForm(p => ({ ...p, fullName: e.target.value }))}
                      className="field"
                      placeholder="Full name"
                    />
                    <input
                      value={shippingForm.company}
                      onChange={(e) => setShippingForm(p => ({ ...p, company: e.target.value }))}
                      className="field"
                      placeholder="Company (optional)"
                    />
                    <input
                      value={shippingForm.phone}
                      onChange={(e) => setShippingForm(p => ({ ...p, phone: e.target.value }))}
                      className="field"
                      placeholder="Phone number"
                    />
                    <input
                      value={shippingForm.address}
                      onChange={(e) => setShippingForm(p => ({ ...p, address: e.target.value }))}
                      className="field md:col-span-2"
                      placeholder="Street address"
                    />
                    <input
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm(p => ({ ...p, city: e.target.value }))}
                      className="field"
                      placeholder="City"
                    />
                    <input
                      value={shippingForm.country}
                      onChange={(e) => setShippingForm(p => ({ ...p, country: e.target.value }))}
                      className="field"
                      placeholder="Country"
                    />
                    <input
                      value={shippingForm.postalCode}
                      onChange={(e) => setShippingForm(p => ({ ...p, postalCode: e.target.value }))}
                      className="field"
                      placeholder="Postal code"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={shippingForm.isDefault}
                      onChange={(e) => setShippingForm(p => ({ ...p, isDefault: e.target.checked }))}
                      className="rounded border-border"
                    />
                    Set as default shipping address
                  </label>
                  <div className="flex gap-3">
                    <button onClick={cancelEditShipping} className="flex-1 btn-outline text-[13px] py-2">Cancel</button>
                    <button
                      onClick={editingShipping === "new" ? handleAddShippingProfile : () => handleUpdateShippingProfile(editingShipping)}
                      disabled={shippingLoading}
                      className="flex-1 btn-primary justify-center text-[13px] py-2"
                    >
                      {shippingLoading ? "Saving…" : <><Save className="w-3.5 h-3.5" /> {editingShipping === "new" ? "Add Profile" : "Update Profile"}</>}
                    </button>
                  </div>
                </div>
              )}

              {shippingProfiles.length === 0 ? (
                <div className="text-center py-8 text-fog/60">
                  <MapPin className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No shipping profiles yet</p>
                  <p className="text-xs mt-1">Add your shipping addresses for faster checkout</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shippingProfiles.map((profile) => (
                    <div key={profile._id} className="bg-linen/50 border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h5 className="text-espresso font-medium">{profile.name || profile.fullName}</h5>
                          {profile.isDefault && <span className="badge-sage text-[10px]">Default</span>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEditShipping(profile)} className="text-tan hover:text-sienna">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteShippingProfile(profile._id)} className="text-rust hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-fog space-y-1">
                        <p>{profile.fullName}</p>
                        {profile.company && <p>{profile.company}</p>}
                        <p>{profile.address}</p>
                        <p>{profile.city}, {profile.country} {profile.postalCode}</p>
                        <p>{profile.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Password */}
            <Section title="Change Password" icon={Lock}>
              {pwStep === 0 && (
                <div className="space-y-3">
                  <p className="text-fog text-sm font-light">
                    We'll send a verification code to <span className="text-espresso font-medium">{user?.email}</span> before allowing a password change.
                  </p>
                  <button onClick={handleRequestOtp} disabled={pwLoading} className="btn-outline w-full justify-center text-[13px] py-3">
                    {pwLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin-slow" />Sending code…</span> : "Send Verification Code"}
                  </button>
                </div>
              )}

              {pwStep === 1 && (
                <div className="space-y-5">
                  <p className="text-fog text-sm text-center">Enter the 6-digit code sent to <span className="text-espresso font-medium">{user?.email}</span></p>
                  <OtpInput otp={pwOtp} onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} />
                  <button onClick={() => { if (pwOtp.join("").length !== 6) { toast.error("Enter complete 6-digit code"); return; } setPwStep(2); }}
                    disabled={pwOtp.join("").length !== 6}
                    className="btn-primary w-full justify-center text-[13px] py-3">Verify Code</button>
                  <p className="text-center text-fog text-[13px]">
                    Didn't get it?{" "}
                    {resendCD > 0 ? <span className="text-fog/40">Resend in {resendCD}s</span>
                      : <button onClick={handleResend} className="text-tan hover:text-sienna transition-colors">Resend</button>}
                  </p>
                  <button onClick={() => setPwStep(0)} className="w-full text-[13px] text-fog/50 hover:text-fog transition-colors">Cancel</button>
                </div>
              )}

              {pwStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 bg-sage/10 border border-sage/20 rounded-xl px-4 py-2.5">
                    <CheckCircle className="w-4 h-4 text-sage" />
                    <span className="text-sage text-sm">Identity verified</span>
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-widest uppercase text-fog font-medium mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fog/60" />
                      <input type={showPw ? "text" : "password"} value={newPw}
                        onChange={(e) => { setNewPw(e.target.value); setPwErrors((p) => ({ ...p, password: "" })); }}
                        className={`field pl-11 pr-11 ${pwErrors.password ? "field-error" : ""}`} placeholder="New password" />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fog/50 hover:text-fog transition-colors">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Err msg={pwErrors.password} />
                    {newPw && (
                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        {requirements.map((r) => (
                          <div key={r.label} className={`flex items-center gap-1.5 text-[11px] ${r.test(newPw) ? "text-sage" : "text-fog/40"}`}>
                            <CheckCircle className={`w-2.5 h-2.5 ${r.test(newPw) ? "text-sage" : "text-border"}`} />
                            {r.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-widest uppercase text-fog font-medium mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fog/60" />
                      <input type={showCPw ? "text" : "password"} value={confirmPw}
                        onChange={(e) => { setConfirmPw(e.target.value); setPwErrors((p) => ({ ...p, confirm: "" })); }}
                        className={`field pl-11 pr-11 ${pwErrors.confirm ? "field-error" : ""}`} placeholder="Confirm new password" />
                      <button type="button" onClick={() => setShowCPw(!showCPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fog/50 hover:text-fog transition-colors">
                        {showCPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Err msg={pwErrors.confirm} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setPwStep(0); setNewPw(""); setConfirmPw(""); }} className="flex-1 btn-outline text-[13px] py-3">Cancel</button>
                    <button onClick={handleChangePassword} disabled={pwLoading} className="flex-1 btn-primary justify-center text-[13px] py-3">
                      {pwLoading ? "Saving…" : "Change Password"}
                    </button>
                  </div>
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}