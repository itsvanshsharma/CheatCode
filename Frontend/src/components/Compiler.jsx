import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

const Compiler = () => {
    const [code, setCode] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [language, setLanguage] = useState('python');
    const [isLoading, setIsLoading] = useState(false);
    const [roomId, setRoomId] = useState('');
    const [isCollaborating, setIsCollaborating] = useState(false);
    const [cursorPositions, setCursorPositions] = useState({});
    const editorRef = useRef(null);
    const socketRef = useRef(null);
    const { room } = useParams();

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io('http://localhost:8000');

        // Handle code updates from other users
        socketRef.current.on('code-update', ({ code: newCode, cursor }) => {
            setCode(newCode);
            if (editorRef.current) {
                editorRef.current.setValue(newCode);
            }
        });

        // Handle cursor updates from other users
        socketRef.current.on('cursor-update', ({ userId, position }) => {
            setCursorPositions(prev => ({
                ...prev,
                [userId]: position
            }));
        });

        // If room parameter exists, join that room
        if (room) {
            setRoomId(room);
            setIsCollaborating(true);
            socketRef.current.emit('join-room', room);
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [room]);

    // Handle code changes
    const handleCodeChange = (newCode) => {
        setCode(newCode);
        if (isCollaborating) {
            socketRef.current.emit('code-change', {
                roomId,
                code: newCode,
                cursor: editorRef.current?.getCursor()
            });
        }
    };

    // Handle cursor movement
    const handleCursorMove = () => {
        if (isCollaborating && editorRef.current) {
            socketRef.current.emit('cursor-move', {
                roomId,
                position: editorRef.current.getCursor()
            });
        }
    };

    // Create new collaboration room
    const createRoom = () => {
        const newRoomId = Math.random().toString(36).substring(7);
        setRoomId(newRoomId);
        setIsCollaborating(true);
        socketRef.current.emit('join-room', newRoomId);
        // Update URL with room ID
        window.history.pushState({}, '', `/compiler/${newRoomId}`);
    };

    // Join existing room
    const joinRoom = () => {
        if (roomId) {
            setIsCollaborating(true);
            socketRef.current.emit('join-room', roomId);
            // Update URL with room ID
            window.history.pushState({}, '', `/compiler/${roomId}`);
        }
    };

    const runCode = async () => {
        setIsLoading(true);
        setError('');
        setOutput('');

        try {
            const response = await axios.post('http://localhost:8000/run-code', {
                code,
                language
            });

            setOutput(response.data.output);
            if (response.data.error) {
                setError(response.data.error);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to run code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-gray-800 text-white px-4 py-2 rounded"
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                    </select>
                    <button
                        onClick={runCode}
                        disabled={isLoading}
                        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                        {isLoading ? 'Running...' : 'Run Code'}
                    </button>
                </div>
                <div className="flex items-center space-x-4">
                    {!isCollaborating ? (
                        <>
                            <button
                                onClick={createRoom}
                                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                            >
                                Create Room
                            </button>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    placeholder="Enter Room ID"
                                    className="bg-gray-800 text-white px-4 py-2 rounded"
                                />
                                <button
                                    onClick={joinRoom}
                                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                                >
                                    Join Room
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-green-500">
                            Room ID: {roomId}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded">
                    <textarea
                        ref={editorRef}
                        value={code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        onKeyUp={handleCursorMove}
                        className="w-full h-96 bg-gray-900 text-white p-4 rounded font-mono"
                        placeholder="Write your code here..."
                    />
                </div>
                <div className="bg-gray-800 p-4 rounded">
                    <h3 className="text-white mb-2">Output:</h3>
                    <pre className="bg-gray-900 text-white p-4 rounded h-96 overflow-auto">
                        {output}
                    </pre>
                    {error && (
                        <div className="mt-2 text-red-500">
                            <h3 className="font-bold">Error:</h3>
                            <pre>{error}</pre>
                        </div>
                    )}
                </div>
            </div>

            {/* Display other users' cursors */}
            {isCollaborating && (
                <div className="mt-4">
                    <h3 className="text-white mb-2">Active Users:</h3>
                    <div className="flex space-x-2">
                        {Object.entries(cursorPositions).map(([userId, position]) => (
                            <div
                                key={userId}
                                className="bg-blue-500 text-white px-3 py-1 rounded"
                            >
                                User {userId.slice(0, 4)}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Compiler;
