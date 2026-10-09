import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib_api.js";
import { storeAuth } from "../lib_auth.js";
import "./AuthPage.css";

const preview = (file) => URL.createObjectURL(file);
function AuthPage({ initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode),
    [role, setRole] = useState("student"),
    [showPassword, setShowPassword] = useState(false),
    [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    institution: "",
    password: "",
    confirmPassword: "",
    ninNumber: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
  });
  const [ninFront, setNinFront] = useState(null),
    [ninBack, setNinBack] = useState(null),
    [frontPreview, setFrontPreview] = useState(""),
    [backPreview, setBackPreview] = useState("");
  const [errors, setErrors] = useState({}),
    [signupStep, setSignupStep] = useState(1),
    [serverMessage, setServerMessage] = useState(""),
    [submitting, setSubmitting] = useState(false);
  const frontRef = useRef(),
    backRef = useRef();
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);
  useEffect(
    () => () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      if (backPreview) URL.revokeObjectURL(backPreview);
    },
    [frontPreview, backPreview],
  );
  const update = (e) => {
    const { name, value } = e.target;
    setForm((v) => ({ ...v, [name]: value }));
    setErrors((v) => ({ ...v, [name]: "" }));
    setServerMessage("");
  };
  const switchMode = (m) => {
    setMode(m);
    setSignupStep(1);
    setErrors({});
    setServerMessage("");
    window.location.hash = m;
  };
  const chooseFile = (setter, setPrev) => (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setter(f);
    setPrev(preview(f));
  };
  const validate = () => {
    const e = {},
      email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (mode === "signup" && !form.fullName.trim())
      e.fullName = "Enter the name or nickname you want to use on StudentNest.";
    if (!email.test(form.email)) e.email = "Enter a valid email address.";
    if (mode === "signup" && !form.phone.trim())
      e.phone = "Enter your phone number.";
    if (mode === "signup" && role === "student" && !form.institution.trim())
      e.institution = "Enter your school or institution.";
    if (
      mode === "signup" &&
      role === "provider" &&
      !/^\d{11}$/.test(form.ninNumber.replace(/\s+/g, ""))
    )
      e.ninNumber = "NIN must contain 11 digits.";
    if (mode === "signup" && role === "provider" && (!ninFront || !ninBack)) {
      e.ninDocs = "Upload both the front and back of your NIN.";
    }
    if (mode === "signup" && role === "provider" && signupStep === 2) {
      if (!form.bankName.trim()) e.bankName = "Select or enter your bank name.";
      if (!form.accountName.trim()) e.accountName = "Enter the account name.";
      if (!/^\d{10}$/.test(form.accountNumber.replace(/\s+/g, ""))) e.accountNumber = "Account number must contain 10 digits.";
    }
    if (!form.password) e.password = "Enter your password.";
    else if (mode === "signup" && form.password.length < 8)
      e.password = "Use at least 8 characters.";
    if (mode === "signup" && form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    return !Object.keys(e).length;
  };
  const submit = async (e) => {
    e.preventDefault();
    if (mode === "signup" && role === "provider" && signupStep === 1) {
      if (!validate()) return;
      setSignupStep(2);
      setErrors({});
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    setServerMessage("");
    try {
      const data = await apiFetch(
        `/auth/${mode === "login" ? "login" : "register"}`,
        {
          method: "POST",
          body: JSON.stringify(
            mode === "login"
              ? { email: form.email, password: form.password }
              : {
                  fullName: form.fullName,
                  email: form.email,
                  phone: form.phone,
                  institution: form.institution,
                  password: form.password,
                  role,
                  bank_name: form.bankName,
                  account_name: form.accountName,
                  account_number: form.accountNumber.replace(/\s+/g, ""),
                },
          ),
        },
      );
      storeAuth(data);
      window.dispatchEvent(new Event("studentnest-auth"));
      if (mode === "signup" && role === "provider") {
        const fd = new FormData();
        fd.append("ninNumber", form.ninNumber.replace(/\s+/g, ""));
        fd.append("ninFront", ninFront);
        fd.append("ninBack", ninBack);
        try {
          await apiFetch("/profile/provider-documents", {
            method: "POST",
            body: fd,
          });
        } catch (err) {
          setServerMessage(
            `Account created, but provider documents could not be saved: ${err.message}`,
          );
        }
      }
      const destination =
        data.user.role === "provider"
          ? "provider-dashboard"
          : data.user.role === "inspector"
            ? "inspection-dashboard"
            : data.user.role === "admin"
              ? "admin-dashboard"
              : "student-dashboard";
      window.location.hash = destination;
    } catch (err) {
      setServerMessage(err.message || "Unable to connect to StudentNest.");
    } finally {
      setSubmitting(false);
    }
  };
  const forgot = async () => {
    const email = window.prompt("Enter your StudentNest email:");
    if (!email) return;
    try {
      const d = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      alert(d.message);
    } catch (e) {
      alert(e.message);
    }
  };
  return (
    <main className='auth-page'>
      <div className='container auth-shell'>
        <section className='auth-brand-panel'>
          <a href='#home' className='auth-logo'>
            StudentNest
          </a>
          <div className='auth-brand-copy'>
            <p className='eyebrow'>Student accommodation · Bauchi</p>
            <h1>
              {mode === "login"
                ? "Welcome back."
                : "Create your StudentNest account."}
            </h1>
            <p>
              {mode === "login"
                ? "Sign in to continue finding a verified place that feels like home."
                : "Choose the account type that matches how you use StudentNest."}
            </p>
          </div>
          <div className='auth-trust-list'>
            <div className='auth-trust-item'>
              <span>✓</span>
              <p>Browse student-friendly accommodation</p>
            </div>
            <div className='auth-trust-item'>
              <span>✓</span>
              <p>Message providers and arrange viewings</p>
            </div>
            <div className='auth-trust-item'>
              <span>✓</span>
              <p>Save homes, bookings and reviews in one place</p>
            </div>
          </div>
        </section>
        <section className='auth-card'>
          <div className='auth-card-header'>
            <div className='auth-tabs'>
              <button
                className={mode === "login" ? "is-active" : ""}
                onClick={() => switchMode("login")}>
                Log in
              </button>
              <button
                className={mode === "signup" ? "is-active" : ""}
                onClick={() => switchMode("signup")}>
                Sign up
              </button>
            </div>
            <p>
              {mode === "login"
                ? "Enter your details to access your account."
                : "It only takes a minute to get started."}
            </p>
          </div>
          {mode === "signup" && !(role === 'provider' && signupStep === 2) && (
            <div className='auth-role-picker'>
              <p className='auth-field-label'>I am joining as</p>
              <div className='auth-role-options'>
                <button
                  type='button'
                  className={role === "student" ? "selected" : ""}
                  onClick={() => setRole("student")}>
                  <strong>Student</strong>
                  <small>Find accommodation</small>
                </button>
                <button
                  type='button'
                  className={role === "provider" ? "selected" : ""}
                  onClick={() => setRole("provider")}>
                  <strong>Provider</strong>
                  <small>List accommodation</small>
                </button>
              </div>
            </div>
          )}
          <form className={`auth-form ${mode === 'signup' && role === 'provider' && signupStep === 2 ? 'provider-signup-step-two' : ''}`} onSubmit={submit} noValidate>
            {mode === "signup" && (
              <AuthField
                label='Name or nickname'
                name='fullName'
                value={form.fullName}
                onChange={update}
                error={errors.fullName}
                placeholder='e.g. Aisha, Zuzu, Aisha Mohammed'
              />
            )}
            <AuthField
              label='Email address'
              name='email'
              type='email'
              value={form.email}
              onChange={update}
              error={errors.email}
              placeholder='you@example.com'
            />
            {mode === "signup" && (
              <AuthField
                label='Phone number'
                name='phone'
                type='tel'
                value={form.phone}
                onChange={update}
                error={errors.phone}
                placeholder='0800 000 0000'
              />
            )}
            {mode === "signup" && role === "student" && (
              <AuthField
                label='School / institution'
                name='institution'
                value={form.institution}
                onChange={update}
                error={errors.institution}
                placeholder='e.g. ATBU'
              />
            )}
            {mode === "signup" && role === "provider" && (
              <>
                <AuthField
                  label='NIN number'
                  name='ninNumber'
                  value={form.ninNumber}
                  onChange={update}
                  error={errors.ninNumber}
                  placeholder='11-digit NIN'
                  inputMode='numeric'
                />
                <div className='nin-upload-grid'>
                  <DocUpload
                    title='NIN front'
                    file={ninFront}
                    preview={frontPreview}
                    onClick={() => frontRef.current?.click()}
                  />
                  <DocUpload
                    title='NIN back'
                    file={ninBack}
                    preview={backPreview}
                    onClick={() => backRef.current?.click()}
                  />
                </div>
                <input
                  ref={frontRef}
                  hidden
                  type='file'
                  accept='image/jpeg,image/png,image/webp'
                  onChange={chooseFile(setNinFront, setFrontPreview)}
                />
                <input
                  ref={backRef}
                  hidden
                  type='file'
                  accept='image/jpeg,image/png,image/webp'
                  onChange={chooseFile(setNinBack, setBackPreview)}
                />
                {errors.ninDocs && (
                  <span className='auth-error'>{errors.ninDocs}</span>
                )}
              </>
            )}
            {mode === 'signup' && role === 'provider' && signupStep === 2 && (
              <div className='provider-payment-step'>
                <div className='auth-step-heading'><span>Step 2 of 2</span><h2>Payment details</h2><p>These details are saved securely for future provider payouts. You can change them later from Provider Space.</p></div>
                <AuthField label='Bank name' name='bankName' value={form.bankName} onChange={update} error={errors.bankName} placeholder='e.g. Access Bank' />
                <AuthField label='Account name' name='accountName' value={form.accountName} onChange={update} error={errors.accountName} placeholder='Name on the bank account' />
                <AuthField label='Account number' name='accountNumber' type='tel' inputMode='numeric' value={form.accountNumber} onChange={update} error={errors.accountNumber} placeholder='10-digit account number' />
                <button type='button' className='auth-back-step' onClick={() => setSignupStep(1)}>← Back to account details</button>
              </div>
            )}
            <PasswordField
              id='auth-password'
              label='Password'
              name='password'
              value={form.password}
              onChange={update}
              show={showPassword}
              toggle={() => setShowPassword((v) => !v)}
              error={errors.password}
              forgot={mode === "login" ? forgot : null}
            />
            {mode === "signup" && (
              <PasswordField
                id='auth-confirm'
                label='Confirm password'
                name='confirmPassword'
                value={form.confirmPassword}
                onChange={update}
                show={showConfirm}
                toggle={() => setShowConfirm((v) => !v)}
                error={errors.confirmPassword}
              />
            )}{" "}
            {mode === "signup" && (
              <label className='auth-checkbox'>
                <input type='checkbox' required />
                <span>
                  I agree to the StudentNest terms and privacy policy.
                </span>
              </label>
            )}
            <button
              className='btn btn-primary auth-submit'
              disabled={submitting}>
              {submitting
                ? "Creating…"
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>
            {serverMessage && (
              <p className='auth-server-message'>{serverMessage}</p>
            )}
          </form>
          <p className='auth-switch-copy'>
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}
function AuthField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  inputMode,
}) {
  return (
    <label className='auth-field'>
      <span>{label}</span>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
      />
      {error && <small className='auth-error'>{error}</small>}
    </label>
  );
}
function PasswordField({
  id,
  label,
  name,
  value,
  onChange,
  show,
  toggle,
  error,
  forgot,
}) {
  return (
    <div className='auth-field'>
      <div className='auth-label-row'>
        <label htmlFor={id}>{label}</label>
        {forgot && (
          <button type='button' className='auth-forgot' onClick={forgot}>
            Forgot password?
          </button>
        )}
      </div>
      <div className='auth-password-wrap'>
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder='At least 8 characters'
        />
        <button type='button' onClick={toggle}>
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error && <small className='auth-error'>{error}</small>}
    </div>
  );
}
function DocUpload({ title, preview: filePreview, file, onClick }) {
  return (
    <button type='button' className='doc-upload' onClick={onClick}>
      {filePreview ? (
        <img src={filePreview} alt={title} />
      ) : (
        <span className='doc-upload-icon'>＋</span>
      )}
      <span>
        <strong>{file ? file.name : title}</strong>
        <small>{file ? "Preview ready" : "Upload image"}</small>
      </span>
    </button>
  );
}
export default AuthPage;
