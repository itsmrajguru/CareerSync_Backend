const mongoose = require('mongoose');

async function checkDb() {
  try {
    await mongoose.connect('mongodb+srv://careersync_user:9527241817@cluster1.buhaewj.mongodb.net/careersync?retryWrites=true&w=majority&appName=Cluster1');
    
    // Check User
    const User = mongoose.connection.collection('users');
    const userObjId = new mongoose.Types.ObjectId('6a2546ae590628cd859ebbc3');
    const user = await User.findOne({ _id: userObjId });
    console.log("User found in LIVE DB:", user);
    
    // Check CompanyProfile
    const Company = mongoose.connection.collection('companies');
    const company = await Company.findOne({ user: userObjId });
    console.log("CompanyProfile found in LIVE DB:", company);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDb();
