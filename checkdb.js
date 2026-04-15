const mongoose = require('mongoose');

const MONGO_URI = "mongodb://sgssanskar14jul7_db_user:662KTWRYdhZabMUM@ac-h1pybiy-shard-00-00.2uk4zhy.mongodb.net:27017,ac-h1pybiy-shard-00-01.2uk4zhy.mongodb.net:27017,ac-h1pybiy-shard-00-02.2uk4zhy.mongodb.net:27017/notesDB?ssl=true&replicaSet=atlas-k9kv5y-shard-0&authSource=admin&retryWrites=true&w=majority";

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

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

const User = mongoose.model('User', UserSchema);
const File = mongoose.model('File', FileSchema);

async function checkDatabase() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log("✓ Connected to MongoDB\n");
    
    const userCount = await User.countDocuments();
    const fileCount = await File.countDocuments();
    
    console.log("═══════════════════════════════════════");
    console.log("DATABASE STATUS:");
    console.log("═══════════════════════════════════════");
    console.log(`Total Users: ${userCount}`);
    console.log(`Total Files: ${fileCount}`);
    console.log("═══════════════════════════════════════\n");
    
    if (userCount > 0) {
      console.log("USERS IN DATABASE:");
      console.log("─────────────────────────────────────");
      const users = await User.find().select('username email createdAt');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Email: ${user.email}\n`);
      });
    } else {
      console.log("❌ No users found in database\n");
    }
    
    if (fileCount > 0) {
      console.log("FILES IN DATABASE:");
      console.log("─────────────────────────────────────");
      const files = await File.find().select('title subject uploadedBy downloads uploadDate');
      files.forEach((file, index) => {
        console.log(`${index + 1}. Title: ${file.title}`);
        console.log(`   Subject: ${file.subject}`);
        console.log(`   Uploaded by: ${file.uploadedBy}`);
        console.log(`   Downloads: ${file.downloads || 0}`);
        console.log(`   Date: ${file.uploadDate}\n`);
      });
    } else {
      console.log("❌ No files found in database\n");
    }
    
    await mongoose.connection.close();
    console.log("✓ Connection closed");
    
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
}

checkDatabase();
