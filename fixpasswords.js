const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = "mongodb://sgssanskar14jul7_db_user:662KTWRYdhZabMUM@ac-h1pybiy-shard-00-00.2uk4zhy.mongodb.net:27017,ac-h1pybiy-shard-00-01.2uk4zhy.mongodb.net:27017,ac-h1pybiy-shard-00-02.2uk4zhy.mongodb.net:27017/notesDB?ssl=true&replicaSet=atlas-k9kv5y-shard-0&authSource=admin&retryWrites=true&w=majority";

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

const User = mongoose.model('User', UserSchema);

async function fixPasswords() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log("✓ Connected to MongoDB\n");
    
    const users = await User.find();
    console.log(`Found ${users.length} users\n`);
    
    let updated = 0;
    
    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2)
      if (!user.password.startsWith('$2')) {
        console.log(`Hashing password for: ${user.username} (${user.email})`);
        const hashedPassword = await bcrypt.hash(user.password, 10);
        user.password = hashedPassword;
        await user.save();
        updated++;
        console.log(`✓ Updated\n`);
      } else {
        console.log(`✓ ${user.username} - Already hashed\n`);
      }
    }
    
    console.log("═══════════════════════════════════════");
    console.log(`Password Migration Complete!`);
    console.log(`Total Updated: ${updated}`);
    console.log("═══════════════════════════════════════\n");
    
    await mongoose.connection.close();
    console.log("✓ Connection closed");
    
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
}

fixPasswords();
