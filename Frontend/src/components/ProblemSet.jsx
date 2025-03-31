import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

function ProblemSet() {
    const [questions, setQuestions] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const user = useSelector((state) => state.user.user);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await axios.get('http://localhost:8000/problems');
                if (response.data) {
                    setQuestions(response.data);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch questions');
                console.error('Error fetching questions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, []);

    if (loading) {
        return (
            <div className="bg-transparent text-gray-200 min-h-screen flex flex-col items-center justify-center">
                <div className="text-xl">Loading problems...</div>
            </div>
        );
    }

    return (
        <div className="bg-transparent text-gray-200 min-h-screen flex flex-col items-center justify-center">
            {/* Header */}
            <header className="bg-transparent p-4 w-full text-center mt-10">
                <h1
                    className="text-5xl font-bold"
                    style={{
                        color: "#ffffff", 
                        fontFamily: "'New Amsterdam', sans-serif", 
                        fontWeight: 500,
                        fontStyle: "normal"
                    }}
                >
                    Problem Set
                </h1>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex justify-center items-center p-4">
                <div className="bg-white bg-opacity-20 backdrop-blur-lg p-6 rounded-lg shadow-lg w-full max-w-4xl mb-56">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}
                    <div className="overflow-y-auto max-h-96">
                        <table className="w-full text-left border-collapse">
                            <thead className="border-b border-gray-700">
                                <tr>
                                    <th className="p-2">Problem Name</th>
                                    <th className="p-2">Solved</th>
                                    <th className="p-2">Difficulty</th>
                                    <th className="p-2">Types of Question</th>
                                </tr>
                            </thead>
                            <tbody>
                                {questions.length > 0 ? (
                                    questions.map((question) => (
                                        <tr
                                            key={question._id}
                                            className="hover:bg-black transition-all border-b border-gray-700"
                                        >
                                            <td className="p-2">
                                                <Link to={`/problems/${question.Q_name}`} className="text-white hover:underline">
                                                    {question.Q_name}
                                                </Link>
                                            </td>
                                            <td className="p-2 text-center">
                                                {question.Solved === 'YES' ? (
                                                    <span className="text-green-500">✔</span>
                                                ) : (
                                                    <span className="text-gray-500">✖</span>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {question.Difficulty === 'Easy' && (
                                                    <span className="text-green-500">Easy</span>
                                                )}
                                                {question.Difficulty === 'Medium' && (
                                                    <span className="text-yellow-500">Medium</span>
                                                )}
                                                {question.Difficulty === 'Hard' && (
                                                    <span className="text-red-500">Hard</span>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {question.TypeOfQues || 'N/A'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-4 text-center">
                                            No questions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ProblemSet;
