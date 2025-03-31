import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`http://localhost:8000/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourse(response.data);
        
        // Check if user is enrolled
        const userResponse = await axios.get('http://localhost:8000/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userEnrolledCourses = userResponse.data.enrolledCourses || [];
        setIsEnrolled(userEnrolledCourses.includes(courseId));
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load course details');
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, navigate]);

  const handleEnroll = () => {
    navigate(`/payment/${courseId}`);
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;
  if (!course) return <div className="text-center p-4">Course not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{course.Course_name}</h1>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-600 mb-4">{course.Course_description}</p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-green-600">
            ₹{course.Course_price}
          </span>
          {isEnrolled ? (
            <button
              disabled
              className="bg-green-500 text-white px-6 py-2 rounded-md cursor-not-allowed"
            >
              Already Enrolled
            </button>
          ) : (
            <button
              onClick={handleEnroll}
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
            >
              Enroll Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails; 