import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddQuestionForm = () => {
  const [formData, setFormData] = useState({
    Q_name: '',
    Q_explanation: '',
    Q_input: '',
    Q_output: '',
    TypeOfQues: '',
    Comp_name: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    return Object.values(formData).every((value) => value.trim() !== '');
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage({ type: 'error', text: 'All fields are required!' });
      return;
    }

    setIsLoading(true);

    const token = localStorage.getItem('authToken'); // Assuming token is stored as 'authToken'

    const headers = {
      'Content-Type': 'application/json',
    };

    // Only add token to headers if exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch('http://localhost:5001/questions', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Question added successfully!' });
        setFormData({
          Q_name: '',
          Q_explanation: '',
          Q_input: '',
          Q_output: '',
          TypeOfQues: '',
          Comp_name: '',
        });
        setTimeout(() => navigate('/questions'), 1500); // Redirect after 1.5s
      } else {
        setMessage({ type: 'error', text: result.error || 'Something went wrong' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to the server. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-white text-3xl font-semibold mb-4">Add a New Question</h2>

      {message && (
        <div className={`alert ${message.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white p-2 rounded-md mb-4`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleAddQuestion}>
        {[
          { id: 'Q_name', label: 'Question Name', type: 'text', placeholder: 'Enter the question name' },
          { id: 'Q_explanation', label: 'Explanation', type: 'textarea', placeholder: 'Explain the question' },
          { id: 'Q_input', label: 'Input Format', type: 'textarea', placeholder: 'Provide input format' },
          { id: 'Q_output', label: 'Output Format', type: 'textarea', placeholder: 'Provide output format' },
          { id: 'TypeOfQues', label: 'Question Type', type: 'text', placeholder: 'Enter the question type' },
          { id: 'Comp_name', label: 'Company Name', type: 'text', placeholder: 'Enter the company name' },
        ].map(({ id, label, type, placeholder }) => (
          <div key={id} className="mt-4">
            <label htmlFor={id} className="block text-white font-medium">
              {label}
            </label>
            {type === 'textarea' ? (
              <textarea
                id={id}
                name={id}
                value={formData[id]} // Ensure formData is properly updated
                onChange={handleChange}
                className="block w-full bg-transparent text-white border-b border-white border-opacity-50 rounded-md p-2 mt-2 placeholder-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
                placeholder={placeholder}
                rows="3"
                required
              />
            ) : (
              <input
                type={type}
                id={id}
                name={id}
                value={formData[id]} // Ensure formData is properly updated
                onChange={handleChange}
                className="block w-full h-[50px] bg-transparent text-white border-b border-white border-opacity-50 rounded-md p-2 mt-2 placeholder-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
                placeholder={placeholder}
                required
              />
            )}
          </div>
        ))}

        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md"
            disabled={isLoading}
          >
            {isLoading ? 'Adding Question...' : 'Add Question'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddQuestionForm;
