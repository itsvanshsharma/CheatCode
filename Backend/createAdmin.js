const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });


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
  softDelete: { type: String, default: 'no' }
});

const User = mongoose.model('User', userSchema);

async function updateAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'CheatCode'
    });
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ U_email: 'admin@example.com' });
    if (!adminUser) {
      console.log('Admin user not found');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    adminUser.U_password = hashedPassword;
    await adminUser.save();
    console.log('Admin user password updated successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin user:', error);
    process.exit(1);
  }
}

updateAdminUser(); 