import React from 'react';

const Roadmap = () => {
  const roadmaps = [
    {
      title: 'Web Development',
      description: 'Master modern web development from basics to advanced concepts',
      topics: [
        'HTML & CSS Fundamentals',
        'JavaScript & ES6+',
        'React.js & Redux',
        'Node.js & Express',
        'MongoDB & Database Design',
        'RESTful APIs',
        'Authentication & Security',
        'Testing & Deployment'
      ],
      duration: '6-8 months',
      level: 'Beginner to Advanced'
    },
    {
      title: 'Data Structures & Algorithms',
      description: 'Comprehensive guide to mastering DSA for technical interviews',
      topics: [
        'Arrays & Strings',
        'Linked Lists',
        'Stacks & Queues',
        'Trees & Graphs',
        'Sorting & Searching',
        'Dynamic Programming',
        'System Design',
        'Problem Solving Patterns'
      ],
      duration: '4-6 months',
      level: 'Intermediate'
    },
    {
      title: 'Machine Learning',
      description: 'Journey into the world of AI and machine learning',
      topics: [
        'Python Programming',
        'Mathematics & Statistics',
        'Data Analysis & Visualization',
        'Supervised Learning',
        'Unsupervised Learning',
        'Deep Learning',
        'Neural Networks',
        'Model Deployment'
      ],
      duration: '8-10 months',
      level: 'Advanced'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Learning Roadmaps</h1>
          <p className="text-xl text-gray-300">
            Choose your path and start your learning journey today
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roadmaps.map((roadmap, index) => (
            <div
              key={index}
              className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <h2 className="text-2xl font-bold text-white mb-4">{roadmap.title}</h2>
              <p className="text-gray-300 mb-6">{roadmap.description}</p>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Topics Covered:</h3>
                <ul className="space-y-2">
                  {roadmap.topics.map((topic, topicIndex) => (
                    <li key={topicIndex} className="flex items-center text-gray-300">
                      <span className="mr-2">•</span>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>Duration: {roadmap.duration}</span>
                <span>Level: {roadmap.level}</span>
              </div>

              <button className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300">
                Start Learning
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
