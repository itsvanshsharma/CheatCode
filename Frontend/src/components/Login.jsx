import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../userSlice';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    U_email: '',
    U_password: '',
  });
  const [message, setMessage] = useState(null); // Object for message type and text
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setPasswordVisibility] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // To track login status
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is already logged in by checking authToken in localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true); // User is logged in
      navigate('/'); // Redirect to homepage or desired page
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null); // Clear any previous messages

    try {
      console.log('Attempting login with:', {
        email: formData.U_email,
        password: formData.U_password ? '***' : undefined
      });

      const response = await axios.post('http://localhost:8000/login', {
        username: formData.U_email, // Send email as username
        password: formData.U_password
      });

      console.log('Login response:', {
        status: response.status,
        hasToken: !!response.data.token,
        hasUser: !!response.data.user,
        data: response.data
      });

      const { token, user } = response.data;

      if (token && user) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        dispatch(setUser(user));
        setMessage({ type: 'success', text: 'Login successful!' });
        navigate('/');
      } else {
        console.error('Invalid response format:', response.data);
        setMessage({ 
          type: 'error', 
          text: 'Invalid response from server. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });

      let errorMessage = 'An error occurred during login.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        if (error.response.data.details) {
          errorMessage += ` (${error.response.data.details})`;
        }
      }

      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center relative">
      {isLoggedIn ? (
        <div className="text-white text-center">
          <h3>You are already logged in. Redirecting...</h3>
        </div>
      ) : (
        <form
          onSubmit={handleLogin}
          className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-lg border border-white border-opacity-10 p-8 w-full max-w-md"
        >
          <h3 className="text-white text-3xl font-medium text-center">Login</h3>

          {/* Username Input */}
          <label htmlFor="username" className="block text-white mt-8 font-medium">
            Username or Email
          </label>
          <input
            type="text"
            id="username"
            name="U_email"
            value={formData.U_email}
            onChange={handleChange}
            className="block w-full h-[50px] bg-transparent text-white border-b border-white border-opacity-50 rounded-md p-2 mt-2 placeholder-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
            placeholder="Enter your username or email"
            required
          />

          {/* Password Input */}
          <label htmlFor="password" className="block text-white mt-4 font-medium">
            Password
          </label>
          <div className="relative">
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              id="password"
              name="U_password"
              value={formData.U_password}
              onChange={handleChange}
              className="block w-full h-[50px] bg-transparent text-white border-b border-white border-opacity-50 rounded-md p-2 mt-2 placeholder-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 text-gray-500 cursor-pointer"
              onClick={() => setPasswordVisibility(!isPasswordVisible)}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              {isPasswordVisible ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`mt-6 w-full h-[50px] bg-white text-[#080710] rounded-md font-semibold ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Logging In...' : 'Login'}
          </button>

          {/* Message */}
          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Link to Signup Page */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-500 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default Login;
