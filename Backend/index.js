const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
const PORT =  8000;
const SECRET_KEY = process.env.JWT_SECRET;
const MONGODB_URL = process.env.MONGODB_URL;

const _dirname = path.resolve();

if (!SECRET_KEY || !MONGODB_URL) {
  console.error('Missing required environment variables. Please check your .env file.');
  console.error('Required variables: JWT_SECRET, MONGODB_URL');
  process.exit(1);
}


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// MongoDB connection
mongoose
  .connect(MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'CheatCode' // Explicitly set the database name
  })
  .then(() => {
    console.log('Connected to MongoDB successfully');
    console.log('Database URL:', MONGODB_URL);
    console.log('Database Name: CheatCode');
    
    // Test the connection by listing collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        console.error('Error listing collections:', err);
      } else {
        console.log('Available collections:', collections.map(c => c.name));
      }
    });

    // Test the User model by counting documents
    User.countDocuments().then(count => {
      console.log('Current number of users in database:', count);
    }).catch(err => {
      console.error('Error counting users:', err);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', {
      message: err.message,
      code: err.code,
      name: err.name
    });
    process.exit(1);
  });

// Add mongoose connection error handler
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', {
    message: err.message,
    code: err.code,
    name: err.name
  });
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Add mongoose connection success handler
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

// Ensure the temporary directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Schemas
const questionSchema = new mongoose.Schema({
  Q_name: { type: String, required: true },
  Q_explanation: { type: String, required: true },
  Q_input: { type: String, required: true },
  Q_output: { type: String, required: true },
  TypeOfQues: { type: String, required: true },
  Solved: { type: String, default: 'No' },
  Comp_name: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
  U_name: { type: String, required: true },
  U_email: { type: String, required: true, unique: true },
  U_password: { type: String, required: true },
  U_dob: { type: Date },
  Status: { type: String, default: 'active' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profilePicture: { type: String },
  bio: { type: String },
  socialLinks: {
    github: { type: String },
    linkedin: { type: String },
    website: { type: String }
  },
  questionsSolved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  questionsAttempted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  successfulSubmissions: { type: Number, default: 0 },
  totalSubmissions: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  softDelete: { type: String, default: 'no' },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
});

// Add methods to user schema
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

userSchema.methods.addAttemptedQuestion = function(questionId) {
  if (!this.questionsAttempted.includes(questionId)) {
    this.questionsAttempted.push(questionId);
  }
  this.totalSubmissions += 1;
  return this.save();
};

userSchema.methods.addSolvedQuestion = function(questionId) {
  if (!this.questionsSolved.includes(questionId)) {
    this.questionsSolved.push(questionId);
  }
  this.successfulSubmissions += 1;
  return this.save();
};

// Models
const Question = mongoose.model('Question', questionSchema);
const User = mongoose.model('User', userSchema);

const authenticateJWT = (req, res, next) => {
  // Extract the token from the "Authorization" header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Supports both `null` and undefined cases

  // Check if token is provided
  if (!token) {
    return res.status(403).json({ error: 'Access denied. No token provided.' });
  }

  // Verify the token
  jwt.verify(token, SECRET_KEY, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token.' });
    }

    // Attach the decoded user information to the request object
    req.user = decodedUser;
    next();
  });
};

// Endpoint to execute code
app.post('/run', async (req, res) => {
  const { language, code, input } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: 'Language and code are required.' });
  }

  const inputFilePath = path.join(tempDir, 'input.txt');
  const codeFilePath = path.join(tempDir, `code.${language}`);
  const outputFilePath = path.join(tempDir, 'output.txt');
  const timeoutDuration = 10000; // 10 seconds timeout

  try {
    // Write input to file if provided
    if (input) {
      fs.writeFileSync(inputFilePath, input);
    } else {
      fs.writeFileSync(inputFilePath, '');
    }

    // Write code to file
    fs.writeFileSync(codeFilePath, code);

    let command;
    switch (language) {
      case 'javascript':
        command = `node ${codeFilePath} < ${inputFilePath}`;
        break;
      case 'python':
        command = `python3 ${codeFilePath} < ${inputFilePath}`;
        break;
      case 'cpp':
        command = `g++ ${codeFilePath} -o ${tempDir}/code && ${tempDir}/code < ${inputFilePath}`;
        break;
      case 'java':
        // Extract class name from code
        const className = code.match(/public\s+class\s+(\w+)/)?.[1] || 'Main';
        fs.writeFileSync(path.join(tempDir, `${className}.java`), code);
        command = `javac ${tempDir}/${className}.java && java -cp ${tempDir} ${className} < ${inputFilePath}`;
        break;
      default:
        return res.status(400).json({ error: 'Unsupported language.' });
    }

    console.log('Executing command:', command);

    const execution = new Promise((resolve, reject) => {
      exec(command, { timeout: timeoutDuration }, (error, stdout, stderr) => {
        if (error && error.killed) {
          reject(new Error('Code execution timed out'));
        } else if (error) {
          reject(new Error(stderr || error.message));
        } else {
          resolve(stdout);
        }
      });
    });

    const output = await Promise.race([
      execution,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Execution timed out')), timeoutDuration)
      )
    ]);

    // Cleanup files
    try {
      fs.unlinkSync(codeFilePath);
      if (language === 'cpp') {
        fs.unlinkSync(path.join(tempDir, 'code'));
      }
      if (language === 'java') {
        const className = code.match(/public\s+class\s+(\w+)/)?.[1] || 'Main';
        fs.unlinkSync(path.join(tempDir, `${className}.java`));
        fs.unlinkSync(path.join(tempDir, `${className}.class`));
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }

    res.json({ 
      output: output.trim(),
      executionTime: `Executed in less than ${timeoutDuration/1000} seconds`
    });

  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({ 
      error: error.message,
      type: error.name,
      details: 'Code execution failed. Please check your code and try again.'
    });
  }
});

// Endpoint to fetch all questions
app.get('/problems', async (req, res) => {
  try {
    const problems = await Question.find();
    res.json(problems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch a single problem by name
app.get('/problems/:name', async (req, res) => {
  try {
    const problem = await Question.findOne({ Q_name: decodeURIComponent(req.params.name) });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    res.json(problem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Signup Endpoint
app.post('/signup', async (req, res) => {
  const { U_name, U_email, U_dob, password, U_password } = req.body;

  try {
    console.log('Signup attempt received:', { U_name, U_email, U_dob }); // Log received data

    // Validate required fields
    if (!U_name || !U_email || (!password && !U_password)) {
      console.log('Missing required fields:', { U_name, U_email, hasPassword: !!(password || U_password) });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    console.log('Checking for existing user with email:', U_email);
    const existingUser = await User.findOne({ U_email });
    if (existingUser) {
      console.log('Email already registered:', U_email);
      return res.status(400).json({ 
        error: 'Email already registered',
        details: 'Please use a different email address'
      });
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password || U_password, 10);

    // Create new user
    console.log('Creating new user object...');
    const newUser = new User({ 
      U_name, 
      U_email, 
      U_dob, 
      U_password: hashedPassword,
      role: 'user' // Explicitly set role
    });

    // Save user to database
    console.log('Attempting to save user to database...');
    const savedUser = await newUser.save();
    console.log('User saved successfully:', {
      id: savedUser._id,
      name: savedUser.U_name,
      email: savedUser.U_email
    });

    // Verify the user was saved by trying to find it
    const verifiedUser = await User.findOne({ U_email: savedUser.U_email });
    if (!verifiedUser) {
      console.error('User verification failed - user not found after save');
      return res.status(500).json({
        error: 'User creation failed',
        details: 'User was not properly saved to the database'
      });
    }

    // Generate token
    console.log('Generating JWT token...');
    const token = jwt.sign({ 
      U_id: savedUser._id,
      role: savedUser.role 
    }, SECRET_KEY, { expiresIn: '1h' });

    console.log('Signup process completed successfully');
    res.status(201).json({ 
      message: 'User created successfully', 
      token,
      user: {
        U_name: savedUser.U_name,
        U_email: savedUser.U_email,
        role: savedUser.role,
        U_id: savedUser._id
      }
    });
  } catch (error) {
    console.error('Signup error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    
    // Check for specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate key error',
        details: 'This email is already registered'
      });
    }
    
    res.status(500).json({ 
      error: 'Error creating user',
      details: error.message
    });
  }
});

app.post('/admin/addquestion', authenticateJWT, async (req, res) => {
  const {
    Q_name,
    Q_explanation,
    Q_input,
    Q_output,
    TypeOfQues,
    Solved,
    Comp_name,
    Difficulty
  } = req.body;

  // Validate required fields
  if (!Q_name || !Q_explanation || !Q_input || !Q_output || !TypeOfQues || !Comp_name || !Difficulty) {
    return res.status(400).send({ error: 'All fields are required' });
  }

  // Create a new question object
  const newQuestion = new Question({
    Q_name,
    Q_explanation,
    Q_input,
    Q_output,
    TypeOfQues,
    Solved: Solved || false,
    Comp_name,
    Difficulty,
  });

  try {
    // Save the new question to the database
    const result = await newQuestion.save();

    // Send success response
    res.status(201).send({
      message: 'Question added successfully',
      question: result,
    });
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).send({ error: 'Failed to add question' });
  }
});

// Login Endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('Login attempt received:', {
    username,
    hasPassword: !!password,
    body: req.body
  });

  try {
    // Validate required fields
    if (!username || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Please provide both username/email and password'
      });
    }

    // Search for user by email
    console.log('Searching for user by email:', username);
    const user = await User.findOne({ U_email: username });
    console.log('User search result:', user ? 'Found' : 'Not found');

    if (!user) {
      console.log('User not found for:', username);
      return res.status(400).json({ 
        error: 'User not found. Please check your credentials.',
        details: 'No user found with the provided email'
      });
    }

    console.log('Found user:', {
      id: user._id,
      name: user.U_name,
      email: user.U_email,
      hasPassword: !!user.U_password,
      role: user.role
    });

    const isPasswordValid = await bcrypt.compare(password, user.U_password);
    console.log('Password validation:', isPasswordValid ? 'Valid' : 'Invalid');

    if (!isPasswordValid) {
      return res.status(400).json({ 
        error: 'Invalid password.',
        details: 'The password provided is incorrect'
      });
    }

    const token = jwt.sign({ 
      U_id: user._id,
      role: user.role
    }, SECRET_KEY, { expiresIn: '1h' });
    
    console.log('Login successful for user:', user.U_email);
    
    res.status(200).json({ 
      message: 'Login successful', 
      token,
      user: {
        U_name: user.U_name,
        U_email: user.U_email,
        role: user.role,
        U_id: user._id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Profile routes
app.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.U_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      U_name: user.U_name,
      U_email: user.U_email,
      U_dob: user.U_dob,
      profilePicture: user.profilePicture,
      bio: user.bio,
      socialLinks: user.socialLinks,
      questionsSolved: user.questionsSolved.length,
      questionsAttempted: user.questionsAttempted.length,
      successfulSubmissions: user.successfulSubmissions,
      totalSubmissions: user.totalSubmissions
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile data' });
  }
});

app.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const { bio, socialLinks } = req.body;
    const user = await User.findById(req.user.U_id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.bio = bio;
    user.socialLinks = socialLinks;
    await user.save();

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Profile picture upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pictures/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

app.post('/profile/upload-picture', authenticateJWT, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await User.findById(req.user.U_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old profile picture if it exists
    if (user.profilePicture) {
      const oldPicturePath = path.join(__dirname, user.profilePicture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    user.profilePicture = req.file.path;
    await user.save();

    res.json({ 
      message: 'Profile picture updated successfully',
      profilePicture: user.profilePicture
    });
  } catch (error) {
    res.status(500).json({ error: 'Error uploading profile picture' });
  }
});

// Course Schema
const courseSchema = new mongoose.Schema({
  Course_id: { type: String, required: true, unique: true },
  Course_name: { type: String, required: true },
  Course_price: { type: Number, required: true },
  Course_description: { type: String, required: true },
  Status: { type: String, default: 'active' },
  SoftDelete: { type: String, default: 'no' },
  razorpayProductId: { type: String },
  enrolledUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Course Model
const Course = mongoose.model('Course', courseSchema);

// Endpoint to fetch all courses
app.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({ SoftDelete: 'no', Status: 'active' }); // Fetch only active courses not soft-deleted
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch detailed information about a single course by ID
app.get('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findOne({ Course_id: req.params.id, SoftDelete: 'no' });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Endpoint to Add a Question
app.post('/questions', authenticateJWT, async (req, res) => {
  const { Q_name, Q_explanation, Q_input, Q_output, TypeOfQues, Solved, Comp_name } = req.body;

  try {
    const newQuestion = new Question({ Q_name, Q_explanation, Q_input, Q_output, TypeOfQues, Solved, Comp_name });
    await newQuestion.save();

    res.status(201).json({ message: 'Question added successfully', question: newQuestion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/getUser/:username', (req, res) => {
  const { username } = req.params;

  // Validate the username parameter
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid username provided' });
  }

  console.log('Searching for user:', username);  // Debugging log

  User.findOne({ U_name: username })
    .then(user => {
      if (user) {
        res.json({ success: true, user });
      } else {
        console.log('User not found:', username);  // Debugging log
        res.status(404).json({ success: false, message: 'User not found' });
      }
    })
    .catch(err => {
      console.error('Error fetching user:', err);
      res.status(500).json({ success: false, message: 'Error fetching user data' });
    });
});

// Add CodeModel Schema
const codeSchema = new mongoose.Schema({
  user: { type: String, required: true },
  Q_id: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const CodeModel = mongoose.model('Code', codeSchema);

app.post('/submitCode', async (req, res) => {
  const { user, Q_id, code } = req.body;

  if (!user || !Q_id || !code) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Save code to the database
    await CodeModel.create({
      user,
      Q_id,
      code,
      createdAt: new Date(),
    });
    res.status(200).json({ message: 'Code saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving code', error: error.message });
  }
});

// Endpoint to get the logged-in user's profile
app.use(express.static(path.join(_dirname, '/Frontend/dist')));
app.get('*', (_,res) => {
  res.sendFile(path.resolve(_dirname, "Frontend", "dist", "index.html"));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Add these new endpoints after the existing profile endpoint
app.get('/profile/stats', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.U_id)
      .populate('questionsAttempted')
      .populate('questionsSolved');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = {
      totalQuestions: await Question.countDocuments(),
      questionsAttempted: user.questionsAttempted.length,
      questionsSolved: user.questionsSolved.length,
      submissionRate: user.totalSubmissions > 0 
        ? ((user.successfulSubmissions / user.totalSubmissions) * 100).toFixed(2)
        : 0,
      totalSubmissions: user.totalSubmissions,
      successfulSubmissions: user.successfulSubmissions,
      joinedDate: user.joinedDate,
      lastActive: user.lastActive
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/profile/full', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.U_id)
      .populate('questionsAttempted')
      .populate('questionsSolved')
      .select('-U_password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update last active
    await user.updateLastActive();

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile endpoint
app.put('/profile/update', authenticateJWT, async (req, res) => {
  const {
    U_name,
    U_email,
    U_dob,
    bio,
    socialLinks,
    profilePicture
  } = req.body;

  try {
    const user = await User.findById(req.user.U_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (U_name) user.U_name = U_name;
    if (U_email) user.U_email = U_email;
    if (U_dob) user.U_dob = new Date(U_dob);
    if (bio) user.bio = bio;
    if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only middleware
const isAdmin = async (req, res, next) => {
  try {
    // Check role directly from the decoded token
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin endpoints
app.post('/admin/create', async (req, res) => {
  const { U_name, U_email, password, adminSecret } = req.body;

  // Verify admin secret
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Invalid admin secret' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({
      U_name,
      U_email,
      U_password: hashedPassword,
      role: 'admin',
      U_dob: new Date(), // Required field, but not as important for admin
    });

    await admin.save();
    res.status(201).json({ message: 'Admin user created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update the existing addquestion endpoint to use admin middleware
app.post('/admin/addquestion', authenticateJWT, isAdmin, async (req, res) => {
  const {
    Q_name,
    Q_explanation,
    Q_input,
    Q_output,
    TypeOfQues,
    Comp_name,
    Difficulty
  } = req.body;

  try {
    const newQuestion = new Question({
      Q_name,
      Q_explanation,
      Q_input,
      Q_output,
      TypeOfQues,
      Comp_name,
      Difficulty,
    });

    const result = await newQuestion.save();
    res.status(201).json({
      message: 'Question added successfully',
      question: result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only endpoints
// Add a new problem
app.post('/admin/addquestion', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { Q_name, Q_explanation, Q_input, Q_output, TypeOfQues, Comp_name } = req.body;
    
    // Check if problem already exists
    const existingProblem = await Question.findOne({ Q_name });
    if (existingProblem) {
      return res.status(400).json({ error: 'Problem with this name already exists' });
    }

    const newQuestion = new Question({
      Q_name,
      Q_explanation,
      Q_input,
      Q_output,
      TypeOfQues,
      Comp_name,
      Solved: 'No'
    });

    await newQuestion.save();
    res.status(201).json({ message: 'Problem added successfully', question: newQuestion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a problem
app.delete('/admin/problems/:name', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const problem = await Question.findOneAndDelete({ Q_name: decodeURIComponent(req.params.name) });
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a problem
app.put('/admin/problems/:name', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { Q_explanation, Q_input, Q_output, TypeOfQues, Comp_name } = req.body;
    const problem = await Question.findOneAndUpdate(
      { Q_name: decodeURIComponent(req.params.name) },
      { Q_explanation, Q_input, Q_output, TypeOfQues, Comp_name },
      { new: true }
    );
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    res.json({ message: 'Problem updated successfully', question: problem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user progress endpoint
app.post('/update-progress', authenticateJWT, async (req, res) => {
    try {
        const { questionId, solved } = req.body;
        const userId = req.user.U_id;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the question
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Update user's progress
        if (solved) {
            // Add to solved questions if not already there
            if (!user.questionsSolved.includes(questionId)) {
                user.questionsSolved.push(questionId);
                user.successfulSubmissions += 1;
            }
        }

        // Add to attempted questions if not already there
        if (!user.questionsAttempted.includes(questionId)) {
            user.questionsAttempted.push(questionId);
            user.totalSubmissions += 1;
        }

        // Save the updated user
        await user.save();

        res.json({
            message: 'Progress updated successfully',
            questionsSolved: user.questionsSolved.length,
            questionsAttempted: user.questionsAttempted.length,
            successfulSubmissions: user.successfulSubmissions,
            totalSubmissions: user.totalSubmissions
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Get course details
app.get('/courses/:courseId', authenticateJWT, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
});

// Create Razorpay order
app.post('/create-order', authenticateJWT, async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if user is already enrolled
    const user = await User.findById(req.user.U_id);
    if (user.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    const options = {
      amount: course.Course_price * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `course_${courseId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify payment and enroll user
app.post('/verify-payment', authenticateJWT, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Get course ID from order receipt
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const courseId = order.receipt.split('_')[1];

    // Update user's enrolled courses
    const user = await User.findById(req.user.U_id);
    user.enrolledCourses.push(courseId);
    await user.save();

    // Update course's enrolled users
    const course = await Course.findById(courseId);
    course.enrolledUsers.push(req.user.U_id);
    await course.save();

    res.json({ message: 'Payment verified and enrollment successful' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Update course creation endpoint
app.post('/admin/addcourse', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { Course_id, Course_name, Course_price, Course_description } = req.body;

    const newCourse = new Course({
      Course_id,
      Course_name,
      Course_price,
      Course_description
    });

    await newCourse.save();
    res.status(201).json({ message: 'Course added successfully', course: newCourse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Join a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Client joined room: ${roomId}`);
  });

  // Handle code changes
  socket.on('code-change', (data) => {
    socket.to(data.roomId).emit('code-update', {
      code: data.code,
      cursor: data.cursor
    });
  });

  // Handle cursor movement
  socket.on('cursor-move', (data) => {
    socket.to(data.roomId).emit('cursor-update', {
      userId: socket.id,
      position: data.position
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
