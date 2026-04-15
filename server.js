const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your_jwt_secret'; // Change this to a secure secret
const ADMIN_EMAIL = 'admin@iiitr.ac.in';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '12345';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// MongoDB connection
mongoose.connect(
  "mongodb://sgssanskar14jul7_db_user:662KTWRYdhZabMUM@ac-h1pybiy-shard-00-00.2uk4zhy.mongodb.net:27017,ac-h1pybiy-shard-00-01.2uk4zhy.mongodb.net:27017,ac-h1pybiy-shard-00-02.2uk4zhy.mongodb.net:27017/notesDB?ssl=true&replicaSet=atlas-k9kv5y-shard-0&authSource=admin&retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
)
.then(async () => {
  console.log("MongoDB connected");
  await ensureAdminUser();
})
.catch(err => console.log("MongoDB connection failed:", err.message));

// Models 
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});
const User = mongoose.model('User', UserSchema);

const FileSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  path: String,
  uploadedBy: String,
  title: String,
  subject: String,
  semester: String,
  description: String,
  downloads: { type: Number, default: 0 },
  uploadDate: { type: Date, default: Date.now }
});
const File = mongoose.model('File', FileSchema);

async function ensureAdminUser() {
  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: hashedPassword
    });
    console.log('Admin user created: admin@iiitr.ac.in / 12345');
  }
}

const isIIITEmail = (email) => /^[^\s@]+@iiitr\.ac\.in$/i.test(email);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Routes

// Health check - test MongoDB connection
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection state
    if (mongoose.connection.readyState === 1) {
      // Test a simple query
      await User.findOne({});
      res.json({ 
        status: 'OK',
        message: 'MongoDB connection is healthy',
        mongodb: 'Connected',
        timestamp: new Date()
      });
    } else {
      res.status(500).json({ 
        status: 'ERROR',
        message: 'MongoDB not connected',
        mongodb: 'Disconnected',
        timestamp: new Date()
      });
    }
  } catch (err) {
    res.status(500).json({ 
      status: 'ERROR',
      message: 'MongoDB connection test failed',
      error: err.message,
      timestamp: new Date()
    });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!isIIITEmail(email)) {
      return res.status(400).json({ message: 'Only iiitr.ac.in email addresses are allowed' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.log('DB error:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (!isIIITEmail(email)) {
      return res.status(400).json({ message: 'Only iiitr.ac.in email addresses are allowed' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL;
    const token = jwt.sign({ id: user._id, username: user.username, email: user.email, isAdmin }, JWT_SECRET);
    res.json({ token, username: user.username, isAdmin });
  } catch (err) {
    console.log('DB error:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Failed to authenticate token' });
    req.userId = decoded.id;
    req.username = decoded.username;
    req.email = decoded.email;
    req.isAdmin = decoded.isAdmin || false;
    next();
  });
};

// Upload file
app.post('/api/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { title, subject, semester, description } = req.body;
    const file = new File({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      uploadedBy: req.username,
      title,
      subject,
      semester,
      description
    });
    await file.save();
    res.json({ message: 'File uploaded successfully' });
  } catch (err) {
    console.log('DB error:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Get files for browse
app.get('/api/files', verifyToken, async (req, res) => {
  const files = await File.find({});
  res.json(files);
});

// Delete file (admin only)
app.delete('/api/files/:id', verifyToken, async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: 'Admin only' });
  }
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    await File.deleteOne({ _id: req.params.id });
    if (file.path) {
      fs.rm(file.path, { force: true }, (err) => {
        if (err) console.log('File delete error:', err);
      });
    }
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.log('Delete error:', err);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

// Download file
app.get('/api/download/:id', verifyToken, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    
    // Increment download count
    file.downloads = (file.downloads || 0) + 1;
    await file.save();
    
    res.download(file.path, file.originalname);
  } catch (err) {
    console.log('Download error:', err);
    res.status(500).json({ message: 'Download failed' });
  }
});

// Dashboard
app.get('/api/dashboard', verifyToken, async (req, res) => {
  const userFiles = await File.find({ uploadedBy: req.username });
  const totalUploads = await File.countDocuments();
  const totalDownloadsResult = await File.aggregate([
    { $group: { _id: null, count: { $sum: { $ifNull: ['$downloads', 0] } } } }
  ]);
  const totalDownloads = totalDownloadsResult[0]?.count || 0;
  res.json({ 
    username: req.username, 
    files: userFiles,
    totalUploads,
    totalDownloads
  });
});

// Reset Password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password reset successfully. Please login with new password.' });
  } catch (err) {
    console.log('Reset error:', err);
    res.status(500).json({ message: 'Reset failed', error: err.message });
  }
});

// Cleanup - Delete all files from database (for testing)
app.delete('/api/cleanup', async (req, res) => {
  try {
    const result = await File.deleteMany({});
    res.json({ 
      message: 'All files deleted from database',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ message: 'Cleanup failed', error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});