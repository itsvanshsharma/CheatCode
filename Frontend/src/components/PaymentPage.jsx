import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaymentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch course details
        const courseResponse = await axios.get(`http://localhost:8000/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourse(courseResponse.data);

        // Create order
        const orderResponse = await axios.post(
          'http://localhost:8000/create-order',
          { courseId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderResponse.data.amount,
          currency: orderResponse.data.currency,
          name: "CheatCode",
          description: `Purchase for ${courseResponse.data.Course_name}`,
          order_id: orderResponse.data.orderId,
          handler: async (response) => {
            try {
              // Verify payment
              await axios.post(
                'http://localhost:8000/verify-payment',
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              
              alert('Payment successful! You are now enrolled in the course.');
              navigate('/courses');
            } catch (err) {
              alert('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: "User Name",
            email: "user@example.com",
            contact: "9999999999"
          },
          theme: {
            color: "#3399cc"
          }
        };

        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          const razorpay = new window.Razorpay(options);
          razorpay.open();
          setLoading(false);
        };
        document.body.appendChild(script);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to initiate payment');
        setLoading(false);
      }
    };

    initializePayment();
  }, [courseId, navigate]);

  if (loading) return <div className="text-center p-4">Loading payment...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;
  if (!course) return <div className="text-center p-4">Course not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Complete Your Purchase</h1>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">{course.Course_name}</h2>
        <p className="text-gray-600 mb-4">{course.Course_description}</p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-green-600">
            ₹{course.Course_price}
          </span>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
          >
            Retry Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 