import { useReducer, useState } from 'react';
import './Auth.css';
import useUser from './useUser';

export default function Auth() {
  const { Login } = useUser();
  document.title = 'Auth';
  const [showSignUp, setShowSignUp] = useState(false);
  const [load, setload] = useState(false);

  function handleToggleForm() {
    setShowSignUp((prev) => {
      const newValue = !prev;
      return newValue;
    });
  }

  // Reducer and State
  const initialState = {
    inputSigInEmail: '',
    inputSignInPassword: '',
    selectDurationToken: '',
  };

  function reduce(state, action) {
    switch (action.type) {
      case 'CHANGE_FIELD':
        return {
          ...state,
          [action.name]: action.value,
        };
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(reduce, initialState);

  function handleChange(e) {
    const { name, value } = e.target;
    dispatch({
      type: 'CHANGE_FIELD',
      name,
      value,
    });
  }

  // Login handler
  function handleLoginUser(e) {
    e.preventDefault();
    try {
      setload(true);
      Login(
        state.inputSigInEmail,
        state.inputSignInPassword,
        state.selectDurationToken
      );
    } catch (error) {
      console.log(error);
    } finally { 
      setload(false);
    }
  }

  return (
    <div className="box-authentication">
      {/* FORM SIGNIN */}
      {!showSignUp && (
        <form
          className="box-form box-signIn"
          method="POST"
          onSubmit={handleLoginUser}
        >
          <span className="title-form">Login</span>

          {/* Email user */}
          <div className="box-input">
            <label htmlFor="inputSigInEmail">Insert your email</label>
            <input
              type="email"
              name="inputSigInEmail"
              id="inputSigInEmail"
              value={state.inputSigInEmail}
              onChange={handleChange}
              placeholder="Insert your email"
            />
          </div>

          {/* Password user */}
          <div className="box-input">
            <label htmlFor="inputSignInPassword">Insert your password</label>
            <input
              type="password"
              name="inputSignInPassword"
              id="inputSignInPassword"
              value={state.inputSignInPassword}
              onChange={handleChange}
              placeholder="Insert your password"
            />
            <a href="#" className="forgot-password">
              <span>Forgot password?</span>
            </a>
          </div>

          {/* Duration token */}
          <div className="box-input">
            <label htmlFor="selectDurationToken">Select duration token</label>
            <select
              id="selectDurationToken"
              name="selectDurationToken"
              value={state.selectDurationToken}
              onChange={handleChange}
            >
              <option value="" disabled>
                === Select duration token ===
              </option>
              <option value="15m">15 minutes</option>
              <option value="1h">1 hour</option>
              <option value="5h">5 hours</option>
              <option value="1d">1 day</option>
              <option value="15d">15 days</option>
              <option value="30d">30 days</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-submit"
            onClick={handleLoginUser}
          >
            {load ? 'Loading...' : 'Sign In'}
          </button>
          <span className="already-register">
            Don't have an account?{' '}
            <a href="#signup" onClick={handleToggleForm}>
              Sign Up
            </a>
          </span>
        </form>
      )}

      {/* FORM SIGNUP */}
      {showSignUp && (
        <form className="box-form box-signUp">
          <span className="title-form">Sign Up</span>

          {/* First name */}
          <div className="box-fullName">
            <div className="box-input">
              <label htmlFor="yourFirstName">First name</label>
              <input
                type="text"
                name="yourFirstName"
                id="yourFirstName"
                placeholder="Insert your first name"
              />
            </div>

            {/* Last name */}
            <div className="box-input">
              <label htmlFor="yourLastName">Last name</label>
              <input
                type="text"
                name="yourLastName"
                id="yourLastName"
                placeholder="Insert your last name"
              />
            </div>
          </div>

          <div className="box-number-country">
            {/* Country user */}
            <div className="box-input">
              <label htmlFor="selectCountries">Country</label>
              <select id="selectCountries" name="selectCountries">
                <option value="" disabled>
                  === Select your country ===
                </option>
                <option value="brasil">Brazil</option>
                <option value="usa">United States</option>
                <option value="canada">Canada</option>
                <option value="uk">United Kingdom</option>
              </select>
            </div>

            {/* Currency user */}
            <div className="box-input">
              <label htmlFor="selectYourCurrency">Currency</label>
              <select id="selectYourCurrency" name="selectYourCurrency">
                <option value="" disabled>
                  === Select currency ===
                </option>
                <option value="brl">BRL (R$)</option>
                <option value="usd">USD ($)</option>
                <option value="eur">EUR (€)</option>
                <option value="gbp">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="box-docId-phoneNumber">
            {/* Id document */}
            <div className="box-input">
              <label htmlFor="inputSignupIdDoc">Document ID</label>
              <input
                type="text"
                name="inputSignupIdDoc"
                id="inputSignupIdDoc"
                placeholder="Insert your document ID"
              />
            </div>

            {/* Phone number */}
            <div className="box-input">
              <label htmlFor="inputPhoneNumber">Phone number</label>
              <input
                type="tel"
                name="inputPhoneNumber"
                id="inputPhoneNumber"
                placeholder="Insert your phone number"
              />
            </div>
          </div>

          {/* Email user */}
          <div className="box-input">
            <label htmlFor="inputSignupEmail">Email</label>
            <input
              type="email"
              name="inputSignupEmail"
              id="inputSignupEmail"
              placeholder="Insert your email"
            />
          </div>

          {/* Password user */}
          <div className="box-input">
            <label htmlFor="inputSignupPassword">Password</label>
            <input
              type="password"
              name="inputSignupPassword"
              id="inputSignupPassword"
              placeholder="Insert your password"
            />
          </div>

          <button type="submit" className="btn-submit">
            Sign Up
          </button>
          <span className="already-register">
            Already have an account?{' '}
            <a href="#signin" onClick={handleToggleForm}>
              Sign In
            </a>
          </span>
        </form>
      )}
    </div>
  );
}
