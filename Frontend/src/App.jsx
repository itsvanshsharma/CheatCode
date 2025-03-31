import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CourseDetails from './components/CourseDetails';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancelled from './components/PaymentCancelled';

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

// Lazy load components
const Laptop = lazy(() => import('./components/Laptop'));
const Navbar = lazy(() => import('./components/Navbar'));
const Text = lazy(() => import('./components/Text'));
const ShaderBackground = lazy(() => import('./components/ShaderBackground'));
const Content = lazy(() => import('./components/Content'));
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));
const Compiler = lazy(() => import('./components/Compiler'));
const ProblemSet = lazy(() => import('./components/ProblemSet'));
const SolveProblem = lazy(() => import('./components/SolveProblem'));
const CourseLayout = lazy(() => import('./components/CourseLayout'));
const Roadmaps = lazy(() => import('./components/Roadmap'));
const AddQuestion = lazy(() => import('./components/AddQuestion'));
const Profile = lazy(() => import('./components/Profile'));
const Admin = lazy(() => import('./components/Admin')); // Import Admin component

// Test component for debugging
const TestComponent = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
    <h1 className="text-4xl">Test Component - If you see this, routing is working!</h1>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Error caught in ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div className="error-message">Something went wrong. Please try again later.</div>;
    }
    return this.props.children;
  }
}

export default function App() {
  const textRef = useRef(null);
  const [isLidOpen, setIsLidOpen] = useState(false);

  // ScrollTrigger Effect for Text
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: textRef.current,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => {
        gsap.to(textRef.current, { opacity: 1, duration: 1, ease: 'power1.inOut' });
      },
      onLeave: () => {
        gsap.to(textRef.current, { opacity: 0, duration: 1, ease: 'power1.inOut' });
      },
    });

    // Cleanup on component unmount
    return () => trigger.kill();
  }, []);

  // Lid State Effect
  useEffect(() => {
    gsap.to(textRef.current, {
      opacity: isLidOpen ? 0 : 1,
      duration: 1,
      ease: 'power1.inOut',
    });
  }, [isLidOpen]);

  return (
    <Router>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen text-white bg-black">
            <p>Loading...</p>
          </div>
        }
      >
        <ErrorBoundary>
          <div className="relative min-h-screen bg-gray-900">
            {/* Shader Background */}
            <ShaderBackground />

            {/* Main Content */}
            <div className="relative z-10">
              <Navbar />
              <Routes>
                {/* Test Route */}
                <Route path="/test" element={<TestComponent />} />

                {/* Home Route */}
                <Route
                  path="/"
                  element={
                    <>
                      <div className="relative min-h-screen">
                        {/* Hero Section */}
                        <div className="relative h-screen flex items-center justify-center overflow-hidden">
                          {/* Animated Background */}
                          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 opacity-80"></div>
                          
                          {/* Animated Particles */}
                          <div className="absolute inset-0">
                            <div className="absolute w-2 h-2 bg-purple-500 rounded-full animate-float-1"></div>
                            <div className="absolute w-3 h-3 bg-blue-500 rounded-full animate-float-2"></div>
                            <div className="absolute w-2 h-2 bg-pink-500 rounded-full animate-float-3"></div>
                            <div className="absolute w-3 h-3 bg-indigo-500 rounded-full animate-float-4"></div>
                          </div>
                          
                          {/* Content Container */}
                          <div className="relative z-10 flex flex-col items-center justify-center px-4">
                            {/* Laptop Component with 3D Effect */}
                            <div className="transform hover:scale-105 transition-all duration-500 hover:rotate-3 mb-8 perspective-1000">
                              <div className="transform-style-3d">
                                <Laptop onLidStateChange={setIsLidOpen} />
                              </div>
                            </div>
                            
                            {/* Main Text with Typing Effect */}
                            <div
                              ref={textRef}
                              className="text-white text-center max-w-4xl mx-auto mb-12"
                              style={{ opacity: 1, transition: 'opacity 0.5s ease' }}
                            >
                              <Text />
                            </div>
                            
                            {/* CTA Buttons with Hover Effects */}
                            <div className="flex gap-6 mb-16">
                              <a
                                href="/compiler"
                                className="group px-8 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
                              >
                                <span className="relative inline-block">
                                  Start Coding
                                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
                                </span>
                              </a>
                              <a
                                href="/compiler"
                                className="group px-8 py-3 bg-transparent border-2 border-purple-600 text-white rounded-full hover:bg-purple-600/20 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30"
                              >
                                <span className="relative inline-block">
                                  Try Compiler
                                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
                                </span>
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Features Section with Scroll Animations */}
                        <div className="py-20 bg-gray-900">
                          <div className="max-w-7xl mx-auto px-4">
                            <h2 className="text-4xl font-bold text-center text-white mb-16 animate-fade-in">
                              Why Choose CheatCode?
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                              {/* Feature 1 */}
                              <div className="bg-gray-800 p-8 rounded-xl transform hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 animate-slide-up">
                                <div className="text-purple-500 text-4xl mb-4 animate-bounce">💻</div>
                                <h3 className="text-xl font-semibold text-white mb-4">Real-time Compiler</h3>
                                <p className="text-gray-300">
                                  Code, compile, and run your programs instantly with our powerful online compiler.
                                </p>
                              </div>
                              
                              {/* Feature 2 */}
                              <div className="bg-gray-800 p-8 rounded-xl transform hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                <div className="text-purple-500 text-4xl mb-4 animate-bounce" style={{ animationDelay: '0.2s' }}>🎓</div>
                                <h3 className="text-xl font-semibold text-white mb-4">Expert Courses</h3>
                                <p className="text-gray-300">
                                  Learn from industry experts with our comprehensive programming courses.
                                </p>
                              </div>
                              
                              {/* Feature 3 */}
                              <div className="bg-gray-800 p-8 rounded-xl transform hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                                <div className="text-purple-500 text-4xl mb-4 animate-bounce" style={{ animationDelay: '0.4s' }}>🤝</div>
                                <h3 className="text-xl font-semibold text-white mb-4">Collaborative Learning</h3>
                                <p className="text-gray-300">
                                  Code together in real-time with our collaborative coding environment.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Content Section with Parallax Effect */}
                        <div className="py-20 bg-gray-800 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20"></div>
                          <div className="relative max-w-7xl mx-auto px-4">
                            <Content />
                          </div>
                        </div>
                      </div>
                    </>
                  }
                />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Compiler & Problems Routes */}
                <Route path="/compiler" element={<Compiler />} />
                <Route path="/compiler/:room" element={<Compiler />} />
                <Route path="/problems" element={<ProblemSet />} />
                <Route path="/problems/:name" element={<SolveProblem />} />

                {/* Additional Features */}
                <Route path="/courses" element={<CourseLayout />} />
                <Route path="/roadmaps" element={<Roadmaps />} />
                <Route path="/addquestion" element={<AddQuestion />} />

                {/* Profile Route */}
                <Route path="/profile" element={<Profile />} />

                {/* Admin Route */}
                <Route path="/admin" element={<Admin />} />

                {/* Course Details Route */}
                <Route path="/course/:courseId" element={<CourseDetails />} />

                {/* Payment Routes */}
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancelled" element={<PaymentCancelled />} />
              </Routes>
            </div>
          </div>
        </ErrorBoundary>
      </Suspense>
    </Router>
  );
}
