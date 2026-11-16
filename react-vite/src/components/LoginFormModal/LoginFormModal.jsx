import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaXmark } from "react-icons/fa6";
import { thunkLogin } from "../../redux/session";
import { useModal } from "../../context/Modal";
import { useAppConfig } from "../../utils/safety";
import "./LoginForm.css";

// Log-in pop-up shown when a signed-out visitor tries to like, comment or
// follow. New accounts are made on the full sign-up page, which collects the
// date of birth and the Terms agreement.
function LoginFormModal({ onLoginSuccess }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { closeModal } = useModal();
  const { demo_available: demoAvailable } = useAppConfig();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const done = () => {
    closeModal();
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await dispatch(thunkLogin({ email, password }));
    setIsLoading(false);
    if (res) setErrors(res); else done();
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    const res = await dispatch(thunkLogin({ email: "demo@aa.io", password: "password" }));
    setIsLoading(false);
    if (res) setErrors(res); else done();
  };

  const goSignup = () => {
    closeModal();
    navigate("/signup");
  };

  const loginDisabled = email.length < 4 || password.length < 6 || isLoading;

  return (
    <div className="auth-card auth-card-modal fade-in">
      <button className="auth-close" onClick={closeModal} aria-label="Close">
        <FaXmark />
      </button>
      <span className="abln-logo auth-logo">Aura</span>

      <h1 className="auth-title">Log in to continue</h1>
      <p className="auth-sub">Like videos, follow creators and comment with GIFs 🎬</p>

      <form onSubmit={handleLogin} className="auth-form">
        <label className="auth-label">
          Email{errors.email && <span className="auth-error"> · {errors.email}</span>}
        </label>
        <input className="input" type="email" value={email} autoCapitalize="none" autoComplete="email"
          onChange={(e) => setEmail(e.target.value)} placeholder="you@night.club" required disabled={isLoading} />

        <label className="auth-label">
          Password{errors.password && <span className="auth-error"> · {errors.password}</span>}
        </label>
        <input className="input" type="password" value={password} autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} />

        {errors.general && <p className="auth-error">{errors.general}</p>}

        <button type="submit" className="btn btn-primary auth-submit" disabled={loginDisabled}>
          {isLoading ? "Signing in…" : "Log in"}
        </button>

        {demoAvailable && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <button type="button" className="btn btn-orange auth-submit" onClick={handleDemoLogin} disabled={isLoading}>
              ✨ Try the demo account
            </button>
          </>
        )}
      </form>

      <p className="auth-footer">
        New to Aura?{" "}
        <button type="button" className="auth-link" onClick={goSignup}>
          Create an account
        </button>
      </p>
    </div>
  );
}

export default LoginFormModal;
