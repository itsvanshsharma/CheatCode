import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
        <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
        <p className="mb-4">Your payment was cancelled. No charges were made.</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default PaymentCancelled; 