import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const Admin = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newQuestion, setNewQuestion] = useState({
        Q_name: '',
        Q_explanation: '',
        Q_input: '',
        Q_output: '',
        TypeOfQues: '',
        Comp_name: '',
        Difficulty: 'Easy'
    });
    const [editingQuestion, setEditingQuestion] = useState(null);
    const user = useSelector((state) => state.user.user);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const response = await axios.get('http://localhost:8000/problems');
            setQuestions(response.data);
        } catch (err) {
            setError('Failed to fetch questions');
            console.error('Error fetching questions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewQuestion(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.post('http://localhost:8000/admin/addquestion', newQuestion, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setSuccess('Question added successfully!');
            setNewQuestion({
                Q_name: '',
                Q_explanation: '',
                Q_input: '',
                Q_output: '',
                TypeOfQues: '',
                Comp_name: '',
                Difficulty: 'Easy'
            });
            fetchQuestions();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add question');
            console.error('Error adding question:', err);
        }
    };

    const handleDelete = async (questionName) => {
        if (!window.confirm('Are you sure you want to delete this question?')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            await axios.delete(`http://localhost:8000/admin/problems/${encodeURIComponent(questionName)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setSuccess('Question deleted successfully!');
            fetchQuestions();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete question');
            console.error('Error deleting question:', err);
        }
    };

    const handleEdit = (question) => {
        setEditingQuestion(question);
        setNewQuestion({
            Q_name: question.Q_name,
            Q_explanation: question.Q_explanation,
            Q_input: question.Q_input,
            Q_output: question.Q_output,
            TypeOfQues: question.TypeOfQues,
            Comp_name: question.Comp_name,
            Difficulty: question.Difficulty || 'Easy'
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            await axios.put(`http://localhost:8000/admin/problems/${encodeURIComponent(editingQuestion.Q_name)}`, newQuestion, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setSuccess('Question updated successfully!');
            setEditingQuestion(null);
            setNewQuestion({
                Q_name: '',
                Q_explanation: '',
                Q_input: '',
                Q_output: '',
                TypeOfQues: '',
                Comp_name: '',
                Difficulty: 'Easy'
            });
            fetchQuestions();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update question');
            console.error('Error updating question:', err);
        }
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="bg-transparent text-gray-200 min-h-screen flex flex-col items-center justify-center">
                <div className="text-2xl text-red-500">Access Denied</div>
                <div className="text-lg mt-2">You need admin privileges to access this page.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-transparent text-gray-200 min-h-screen flex flex-col items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="bg-transparent text-gray-200 min-h-screen p-8">
            <h1 className="text-4xl font-bold mb-8 text-center">Admin Dashboard</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Add/Edit Question Form */}
                <div className="bg-white bg-opacity-20 backdrop-blur-lg p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4">
                        {editingQuestion ? 'Edit Question' : 'Add New Question'}
                    </h2>
                    <form onSubmit={editingQuestion ? handleUpdate : handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-2">Question Name</label>
                                <input
                                    type="text"
                                    name="Q_name"
                                    value={newQuestion.Q_name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded bg-gray-700 text-white"
                                    required
                                    disabled={!!editingQuestion}
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Explanation</label>
                                <textarea
                                    name="Q_explanation"
                                    value={newQuestion.Q_explanation}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded bg-gray-700 text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Input Format</label>
                                <textarea
                                    name="Q_input"
                                    value={newQuestion.Q_input}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded bg-gray-700 text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Output Format</label>
                                <textarea
                                    name="Q_output"
                                    value={newQuestion.Q_output}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded bg-gray-700 text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Type of Question</label>
                                <input
                                    type="text"
                                    name="TypeOfQues"
                                    value={newQuestion.TypeOfQues}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded bg-gray-700 text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Company Name</label>
                                <input
                                    type="text"
                                    name="Comp_name"
                                    value={newQuestion.Comp_name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded bg-gray-700 text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Difficulty</label>
                                <select
                                    name="Difficulty"
                                    value={newQuestion.Difficulty}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded bg-gray-700 text-white"
                                    required
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex space-x-4">
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
                            >
                                {editingQuestion ? 'Update Question' : 'Add Question'}
                            </button>
                            {editingQuestion && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingQuestion(null);
                                        setNewQuestion({
                                            Q_name: '',
                                            Q_explanation: '',
                                            Q_input: '',
                                            Q_output: '',
                                            TypeOfQues: '',
                                            Comp_name: '',
                                            Difficulty: 'Easy'
                                        });
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Questions List */}
                <div className="bg-white bg-opacity-20 backdrop-blur-lg p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4">Questions List</h2>
                    <div className="overflow-y-auto max-h-[600px]">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left p-2">Name</th>
                                    <th className="text-left p-2">Type</th>
                                    <th className="text-left p-2">Difficulty</th>
                                    <th className="text-left p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {questions.map((question) => (
                                    <tr key={question._id} className="border-b border-gray-700">
                                        <td className="p-2">{question.Q_name}</td>
                                        <td className="p-2">{question.TypeOfQues}</td>
                                        <td className="p-2">
                                            <span className={`px-2 py-1 rounded text-sm ${
                                                question.Difficulty === 'Easy' ? 'bg-green-500' :
                                                question.Difficulty === 'Medium' ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}>
                                                {question.Difficulty}
                                            </span>
                                        </td>
                                        <td className="p-2">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(question)}
                                                    className="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(question.Q_name)}
                                                    className="bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin; 