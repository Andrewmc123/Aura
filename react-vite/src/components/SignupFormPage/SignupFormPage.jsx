import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { thunkSignup } from "../../redux/session";
import { useAppConfig } from "../../utils/safety";
import "./SignupForm.css";
import "../Safety/Safety.css";

const MIN_PASSWORD = 8;

function ageFrom(isoDate) {
  const born = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const beforeBirthday =
    today.getMonth() < born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function SignupFormPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { minimum_age: minAge } = useAppConfig();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < MIN_PASSWORD) {
      return setErrors({ password: `Password must be at least ${MIN_PASSWORD} characters.` });
    }
    if (password !== confirmPassword) {
      return setErrors({ confirmPassword: "Passwords don't match" });
    }
    const age = ageFrom(birthdate);
    if (age === null || age < 0 || age > 120) {
      return setErrors({ birthdate: "Please enter your date of birth." });
    }
    if (age < minAge) {
      return setErrors({ birthdate: `You must be at least ${minAge} years old to use Aura.` });
    }
    if (!agreed) {
      return setErrors({ agreed_terms: "Please agree to the Terms and Community Guidelines to continue." });
    }

    setIsLoading(true);
    const serverResponse = await dispatch(
      thunkSignup({ email, username, firstname, lastname, password, birthdate, agreed_terms: true })
    );
    setIsLoading(false);

    if (serverResponse) {
      setErrors(serverResponse);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <Link to="/home" className="abln-logo auth-logo">Aura</Link>
        <h1 className="auth-title">Sign up for Aura</h1>
        <p className="auth-sub">Create your account — start posting videos & GIFs tonight 🌃</p>

        {errors.server && <p className="auth-error">{errors.server}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-grid-2">
            <div>
              <label className="auth-label">First name</label>
              <input className="input" type="text" value={firstname} maxLength={30} autoComplete="given-name"
                onChange={(e) => setFirstname(e.target.value)} placeholder="Nova" required />
              {errors.firstname && <p className="auth-error">{errors.firstname}</p>}
            </div>
            <div>
              <label className="auth-label">Last name</label>
              <input className="input" type="text" value={lastname} maxLength={30} autoComplete="family-name"
                onChange={(e) => setLastname(e.target.value)} placeholder="Knight" required />
              {errors.lastname && <p className="auth-error">{errors.lastname}</p>}
            </div>
          </div>

          <label className="auth-label">Username</label>
          <input className="input" type="text" value={username} maxLength={40}
            autoCapitalize="none" autoCorrect="off" autoComplete="username"
            onChange={(e) => setUsername(e.target.value)} placeholder="nightowl" required />
          {errors.username && <p className="auth-error">{errors.username}</p>}

          <label className="auth-label">Email</label>
          <input className="input" type="email" value={email} autoCapitalize="none" autoComplete="email"
            onChange={(e) => setEmail(e.target.value)} placeholder="you@night.club" required />
          {errors.email && <p className="auth-error">{errors.email}</p>}

          <label className="auth-label">Date of birth</label>
          <input className="input" type="date" value={birthdate} autoComplete="bday"
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBirthdate(e.target.value)} required />
          {errors.birthdate && <p className="auth-error">{errors.birthdate}</p>}

          <label className="auth-label">Password</label>
          <input className="input" type="password" value={password} autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)} placeholder={`${MIN_PASSWORD}+ characters`} required />
          {errors.password && <p className="auth-error">{errors.password}</p>}

          <label className="auth-label">Confirm password</label>
          <input className="input" type="password" value={confirmPassword} autoComplete="new-password"
            onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
          {errors.confirmPassword && <p className="auth-error">{errors.confirmPassword}</p>}

          <label className="auth-check">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              I agree to the <Link to="/terms">Terms &amp; Community Guidelines</Link> and
              the <Link to="/privacy">Privacy Policy</Link>. Aura has zero tolerance for
              objectionable content or abusive behaviour.
            </span>
          </label>
          {errors.agreed_terms && <p className="auth-error">{errors.agreed_terms}</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
            {isLoading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupFormPage;
