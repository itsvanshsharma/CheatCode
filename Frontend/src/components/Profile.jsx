import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const Profile = () => {
  const [userData, setUserData] = useState({
    U_name: '',
    U_email: '',
    U_dob: '',
    profilePicture: '',
    bio: '',
    socialLinks: {
      github: '',
      linkedin: '',
      website: ''
    },
    questionsSolved: 0,
    questionsAttempted: 0,
    successfulSubmissions: 0,
    totalSubmissions: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const user = useSelector((state) => state.user.user);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get('http://localhost:8000/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUserData(response.data);
    } catch (err) {
      setError('Failed to fetch user data');
      console.error('Error fetching user data:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setUserData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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

      await axios.put('http://localhost:8000/profile', userData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      fetchUserData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
      console.error('Error updating profile:', err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post('http://localhost:8000/profile/upload-picture', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUserData(prev => ({
        ...prev,
        profilePicture: response.data.profilePicture
      }));
      setSuccess('Profile picture updated successfully!');
    } catch (err) {
      setError('Failed to upload profile picture');
      console.error('Error uploading profile picture:', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-white text-xl">Please log in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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

        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-lg p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8">
            {/* Profile Picture */}
            <div className="relative">
              <img
                src={userData.profilePicture || 'https://via.placeholder.com/150'}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-white border-opacity-20"
              />
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </label>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">{userData.U_name}</h2>
              <p className="text-gray-300 mb-4">{userData.U_email}</p>
              <div className="flex space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{userData.questionsSolved}</div>
                  <div className="text-gray-400">Solved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{userData.questionsAttempted}</div>
                  <div className="text-gray-400">Attempted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {userData.totalSubmissions > 0 
                      ? `${((userData.successfulSubmissions / userData.totalSubmissions) * 100).toFixed(1)}%`
                      : '0%'}
                  </div>
                  <div className="text-gray-400">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label className="block text-white mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={userData.bio}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  rows="4"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white mb-2">GitHub</label>
                  <input
                    type="url"
                    name="socialLinks.github"
                    value={userData.socialLinks.github}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                    placeholder="GitHub URL"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">LinkedIn</label>
                  <input
                    type="url"
                    name="socialLinks.linkedin"
                    value={userData.socialLinks.linkedin}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                    placeholder="LinkedIn URL"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Website</label>
                  <input
                    type="url"
                    name="socialLinks.website"
                    value={userData.socialLinks.website}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                    placeholder="Personal Website"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </form>
          )}

          {/* Display Bio and Social Links when not editing */}
          {!isEditing && (
            <div className="mt-8">
              {userData.bio && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">About</h3>
                  <p className="text-gray-300">{userData.bio}</p>
                </div>
              )}

              {(userData.socialLinks.github || userData.socialLinks.linkedin || userData.socialLinks.website) && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Social Links</h3>
                  <div className="flex space-x-4">
                    {userData.socialLinks.github && (
                      <a
                        href={userData.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-white"
                      >
                        GitHub
                      </a>
                    )}
                    {userData.socialLinks.linkedin && (
                      <a
                        href={userData.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-white"
                      >
                        LinkedIn
                      </a>
                    )}
                    {userData.socialLinks.website && (
                      <a
                        href={userData.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-white"
                      >
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
