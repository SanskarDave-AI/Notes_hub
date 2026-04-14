const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your_jwt_secret'; // Change this to a secure secret

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
.then(() => console.log("MongoDB connected"))
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
  uploadDate: { type: Date, default: Date.now }
});
const File = mongoose.model('File', FileSchema);

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

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
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
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
    res.json({ token, username: user.username });
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

// Download file
app.get('/api/download/:id', verifyToken, async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ message: 'File not found' });
  res.download(file.path, file.originalname);
});

// Dashboard
app.get('/api/dashboard', verifyToken, async (req, res) => {
  const userFiles = await File.find({ uploadedBy: req.username });
  res.json({ username: req.username, files: userFiles });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});