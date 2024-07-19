// db.js
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/loan_management')
  .then(() => {
    console.log('Mongoose connected');
    createAdminUser();
  })
  .catch((e) => {
    console.log('Mongoose connection failed', e);
  });

// Define User schema and model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

// Define Loan schema and model
const loanSchema = new mongoose.Schema({
  proof: { type: String, required: true },
  identification: { type: String, required: true },
  purpose: { type: String, required: true },
  amount: { type: Number, required: true },
  income: { type: Number, required: true },
  job: { type: String, required: true },
  interestRate: { type: Number, default: 5 },
  status: { type: String, default: 'Pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestDate: { type: Date, default: Date.now },
  repayDate: { type: Date }
});
const Loan = mongoose.model('Loan', loanSchema);

// Define Transaction schema and model
const transactionSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
  amount: Number,
  date: { type: Date, default: Date.now },
  status: String
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// Function to create admin user if not exists
async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = "Admin";

  try {
    const admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      await User.create({ name: adminName, email: adminEmail, password: adminPassword, phone: '0000000000', isAdmin: true });
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

module.exports = {
  User,
  Loan,
  Transaction
};
