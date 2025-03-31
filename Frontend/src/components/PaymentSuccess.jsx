import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const courseId = queryParams.get('courseId');

    if (!courseId) {
      setError('No course ID provided');
      setLoading(false);
      return;
    }

    // You can add additional verification here if needed
    setLoading(false);
  }, [location]);

  if (loading) return <div className="text-center p-4">Verifying payment...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="mb-4">Thank you for your purchase. You are now enrolled in the course.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess; 