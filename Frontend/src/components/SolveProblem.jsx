import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const SolveProblem = () => {
  const { name } = useParams();
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [testPassed, setTestPassed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);

  // Fetch problem details
  useEffect(() => {
    if (!name) return;

    const fetchQuestion = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/problems/${encodeURIComponent(name)}`);
        if (response.data) {
          setQuestion(response.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch question');
        console.error('Error fetching question:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [name]);

  // Run the code
  const runCode = async () => {
    setLoading(true);
    setOutput('');
    setError('');
    setTestPassed(null);

    try {
      const response = await axios.post('http://localhost:8000/run', {
        code,
        input: question?.Q_input,
        language,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });

      if (response.data) {
        setOutput(response.data.output);
        const isTestPassed = response.data.output.trim() === question.Q_output.trim();
        setTestPassed(isTestPassed);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error running the code');
      console.error('Error running code:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit the code
  const submitCode = async () => {
    if (!user) {
      setError('Please login to submit your code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/run', {
        code,
        input: question?.Q_input,
        language,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });

      const isTestPassed = response.data.output.trim() === question.Q_output.trim();

      // Update user's progress
      const progressResponse = await axios.post('http://localhost:8000/update-progress', {
        questionId: question._id,
        solved: isTestPassed
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });

      setSubmitted(true);
      setTestPassed(isTestPassed);
      setOutput(response.data.output);

      // Show success message
      if (isTestPassed) {
        setError('Congratulations! Your solution is correct! 🎉');
      } else {
        setError('Your solution is incorrect. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting the code');
      console.error('Error submitting code:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle back navigation
  const handleBackToProblemList = () => {
    navigate('/problems');
  };

  if (loading || !question) {
    return (
      <div className="bg-transparent text-gray-200 min-h-screen flex flex-col items-center justify-center">
        <div className="text-xl">Loading problem...</div>
      </div>
    );
  }

  return (
    <div className="bg-transparent min-h-screen text-gray-200 flex flex-col items-center">
      <header className="bg-gray-800 bg-opacity-60 text-white p-4 sticky top-0 w-full text-center">
        <h1 className="text-2xl font-bold">{question.Q_name}</h1>
        <span className="text-green-500">{question.Difficulty}</span>
      </header>

      <div className="container mx-auto p-4 w-full max-w-6xl">
        <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-blur-lg">
          <h2 className="text-2xl mb-4 text-center font-semibold">Problem Description</h2>
          <p className="text-gray-200">{question.Q_explanation}</p>
        </div>

        <div className="flex mt-8 space-x-6">
          <div className="bg-gray-800 bg-opacity-50 w-2/3 p-4 rounded-lg shadow-lg backdrop-blur-lg">
            <Editor
              height="500px"
              language={language}
              value={code}
              theme="vs-dark"
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                lineNumbers: 'on',
              }}
            />
            <div className="mt-4 flex space-x-4">
              <select
                className="bg-gray-700 bg-opacity-60 text-gray-200 p-2 rounded"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
              <button
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 text-white rounded"
                onClick={runCode}
                disabled={loading}
              >
                {loading ? 'Running...' : 'Run'}
              </button>
              <button
                className="bg-green-500 hover:bg-green-600 px-4 py-2 text-white rounded"
                onClick={submitCode}
                disabled={loading || submitted}
              >
                {loading ? 'Submitting...' : submitted ? 'Submitted' : 'Submit'}
              </button>
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-50 w-1/3 p-4 rounded-lg shadow-lg backdrop-blur-lg">
            <h3 className="text-xl mb-4">Testcase:</h3>
            <div className="bg-gray-700 bg-opacity-30 p-2 rounded">{question.Q_input}</div>
            <div className="mt-2 bg-gray-700 bg-opacity-30 p-2 rounded">
              Expected Output: <span className="text-green-500">{question.Q_output}</span>
            </div>
            {output && (
              <div className="mt-4">
                <h4 className="text-xl">Output:</h4>
                <pre className="bg-gray-700 p-4 text-white">{output}</pre>
                {testPassed === null ? null : (
                  <p className={`mt-2 ${testPassed ? 'text-green-500' : 'text-red-500'}`}>
                    {testPassed ? 'Test Passed!' : 'Test Failed'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          className="mt-8 bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          onClick={handleBackToProblemList}
        >
          Back to Problems
        </button>
      </div>
    </div>
  );
};

export default SolveProblem;
