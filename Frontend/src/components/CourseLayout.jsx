import React from 'react';

const CourseLayout = () => {
  const courses = [
    {
      title: 'Web Development Fundamentals',
      instructor: 'John Doe',
      rating: 4.8,
      students: 1200,
      price: '$49.99',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      description: 'Learn the basics of web development with HTML, CSS, and JavaScript',
      topics: [
        'HTML5 & CSS3',
        'JavaScript Basics',
        'Responsive Design',
        'Web Accessibility'
      ],
      duration: '8 weeks',
      level: 'Beginner'
    },
    {
      title: 'Advanced React Development',
      instructor: 'Jane Smith',
      rating: 4.9,
      students: 800,
      price: '$79.99',
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      description: 'Master React.js with advanced concepts and best practices',
      topics: [
        'React Hooks',
        'Redux & State Management',
        'Performance Optimization',
        'Testing & Deployment'
      ],
      duration: '12 weeks',
      level: 'Advanced'
    },
    {
      title: 'Python for Data Science',
      instructor: 'Mike Johnson',
      rating: 4.7,
      students: 1500,
      price: '$69.99',
      image: 'https://images.unsplash.com/photo-1526378800650-7d4c0a5a4c5d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      description: 'Learn Python programming for data analysis and machine learning',
      topics: [
        'Python Basics',
        'Data Analysis with Pandas',
        'Data Visualization',
        'Machine Learning Basics'
      ],
      duration: '10 weeks',
      level: 'Intermediate'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Available Courses</h1>
          <p className="text-xl text-gray-300">
            Explore our collection of high-quality courses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <div
              key={index}
              className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative h-48">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                  {course.price}
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2">{course.title}</h2>
                <p className="text-gray-300 mb-4">{course.description}</p>
                
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span className="text-white">{course.rating}</span>
                  </div>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-300">{course.students} students</span>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Topics Covered:</h3>
                  <ul className="space-y-1">
                    {course.topics.map((topic, topicIndex) => (
                      <li key={topicIndex} className="flex items-center text-gray-300">
                        <span className="mr-2">•</span>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                  <span>Duration: {course.duration}</span>
                  <span>Level: {course.level}</span>
                </div>

                <div className="flex items-center mb-4">
                  <span className="text-gray-300">Instructor: {course.instructor}</span>
                </div>

                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300">
                  Enroll Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseLayout;
