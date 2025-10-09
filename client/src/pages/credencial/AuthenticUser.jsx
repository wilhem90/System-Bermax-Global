import { useEffect, useReducer, useState } from 'react';
import useAuth from '../../Authentication/UseAuth';
import Load from '../../components/loading/Load.jsx';

import './AuthenticUser.css';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeClosed,
  EyeClosedIcon,
  Lock,
  Mail,
  PhoneCall,
  Timer,
} from 'lucide-react';

export default function AuthenticUser() {
  const [showPassWord, setShowPassword] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const initialState = {
    emailUser: '',
    passwordUser: '',
    expiresAt: '15m',
    firstNameUser: '',
    lastNameUser: '',
    emailUserCreate: '',
    cpfUser: '',
    phoneNumber: '',
    countryUser: '',
    passwordUserCreate: '',
  };

  useEffect(() => {
    document.title = 'Auth';
  }, []);

  function reducer(state, action) {
    return action.type === 'UPDATE_FIELD'
      ? { ...state, [action.field]: action.value }
      : state;
  }

  const [state, dispatch] = useReducer(reducer, initialState);
  const { Login } = useAuth();

  async function handleLogin(e) {
    e.preventDefault();
    try {
      setLoading(true);
      await Login({
        emailUser: state.emailUser,
        passwordUser: state.passwordUser,
        expiresAt: state.expiresAt,
      });

      navigate('/home');
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  function handleShowPassword() {
    setShowPassword((prev) => !prev);
  }

  function toggleMode() {
    setIsLoginMode((prev) => !prev);
  }

  function handleChange(e) {
    dispatch({
      type: 'UPDATE_FIELD',
      field: e.target.name,
      value: e.target.value,
    });
  }

  return (
    <div className="auth-container">
      <div
        className={`auth-form-container ${
          isLoginMode ? 'login-mode' : 'signup-mode'
        }`}
      >
        {/* Sign In Form */}
        <form
          className={`sign-in ${isLoginMode ? 'active' : ''}`}
          onSubmit={handleLogin}
        >
          <h1>Sign In</h1>
          <div className="email-user box-input">
            <Mail className="input-icon" />
            <input
              type="email"
              name="emailUser"
              id="emailUser"
              placeholder="Type your email"
              value={state.emailUser}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            <label htmlFor="emailUser">Your Email</label>
          </div>

          <div className="password-user box-input">
            <Lock className="input-icon" />
            <input
              type={showPassWord ? 'text' : 'password'}
              name="passwordUser"
              id="passwordUser"
              placeholder="Your password"
              value={state.passwordUser}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
            <label htmlFor="passwordUser">Your password</label>
            <span className="password-toggle" onClick={handleShowPassword}>
              {showPassWord ? <Eye /> : <EyeClosedIcon />}
            </span>
          </div>

          <div className="expiresAt">
            <select
              name="expiresAt"
              id="expiresAt"
              value={state.expiresAt}
              onChange={handleChange}
            >
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="1d">1 day</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
            </select>
          </div>

          <div className="forget-password">
            <a href="#forgot">Forgot your password?</a>
          </div>

          <button type="submit" className="auth-button">
            Connect
          </button>
          <span className="auth-toggle" onClick={toggleMode}>
            Don't have an account? Sign up now
          </span>
        </form>

        {/* Sign Up Form */}
        <form className={`sign-up ${!isLoginMode ? 'active' : ''}`}>
          <h1>Create Account</h1>
          <div className="name-fields">
            <div className="first-name box-input">
              <input
                type="text"
                name="firstNameUser"
                id="firstNameUser"
                placeholder="First name"
                value={state.firstNameUser}
                onChange={handleChange}
                required
                autoComplete="additional-name"
              />
              <label htmlFor="firstNameUser">First Name</label>
            </div>
            <div className="last-name box-input">
              <input
                type="text"
                name="lastNameUser"
                id="lastNameUser"
                placeholder="Last name"
                value={state.lastNameUser}
                onChange={handleChange}
                autoComplete="additional-name"
              />
              <label htmlFor="lastNameUser">Last Name</label>
            </div>
          </div>

          <div className="email-user box-input">
            <Mail className="input-icon" />
            <input
              type="email"
              name="emailUserCreate"
              id="emailUserCreate"
              placeholder="Type your email"
              value={state.emailUserCreate}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            <label htmlFor="emailUserCreate">Your Email</label>
          </div>

          <div className="cpf-user box-input">
            <input
              type="text"
              name="cpfUser"
              id="cpfUser"
              placeholder="Document number"
              value={state.cpfUser}
              onChange={handleChange}
              autoComplete="off"
            />
            <label htmlFor="cpfUser">Document ID</label>
          </div>

          <div className="phone-number box-input">
            <PhoneCall className="input-icon" />
            <input
              type="tel"
              name="phoneNumber"
              id="phoneNumber"
              placeholder="Phone number"
              value={state.phoneNumber}
              onChange={handleChange}
              required
              autoComplete="tel"
            />
            <label htmlFor="phoneNumber">Phone Number</label>
          </div>

          <div className="country-user">
            <label htmlFor="countryUser">Country</label>
            <select
              name="countryUser"
              id="countryUser"
              value={state.countryUser}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Select country
              </option>
              <option value="Brasil">Brazil</option>
              <option value="Chile">Chile</option>
              <option value="Mexico">Mexico</option>
            </select>
          </div>

          <div className="password-user box-input">
            <Lock className="input-icon" />
            <input
              type={showPassWord ? 'text' : 'password'}
              name="passwordUserCreate"
              id="passwordUserCreate"
              placeholder="Your password"
              value={state.passwordUserCreate}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            <label htmlFor="passwordUserCreate">Your password</label>
            <span className="password-toggle" onClick={handleShowPassword}>
              {showPassWord ? <EyeClosed /> : <EyeClosedIcon />}
            </span>
          </div>

          <button type="submit" className="auth-button">
            Create Account
          </button>
          <span className="auth-toggle" onClick={toggleMode}>
            Already have an account? Sign In
          </span>
        </form>
      </div>
      {loading && <Load />}
    </div>
  );
}
