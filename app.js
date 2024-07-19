const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');
const app = express();

// Load environment variables
dotenv.config();

// Prepare for Mongoose 7
mongoose.set('strictQuery', false);

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

// Middleware setup
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using https
}));

// Path setup
const viewsPath = path.join(__dirname, 'views');
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath)); // Serve static files from the public directory

// View engine setup
app.set('view engine', 'ejs');
app.set('views', viewsPath);

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

// Landing page route
app.get('/landing', (req, res) => {
  res.render('landing');
});

// Redirect root URL to landing page
app.get('/', (req, res) => {
  res.redirect('/landing');
});

// Admin login route
app.get('/admin-login', (req, res) => {
  res.render('admin-login');
});

app.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && user.password === password && user.isAdmin) {
      req.session.user = user;
      res.status(200).redirect('/admin-dashboard');
    } else {
      res.status(401).send('Invalid credentials or not an admin');
    }
  } catch (e) {
    console.error('Error during admin login: ', e);
    res.status(500).send('An error occurred during admin login');
  }
});

// Admin dashboard route
app.get('/admin-dashboard', async (req, res) => {
  if (req.session.user && req.session.user.isAdmin) {
    try {
      const pendingLoansCount = await Loan.countDocuments({ status: 'Pending' });
      const approvedLoansCount = await Loan.countDocuments({ status: 'Approved' });
      const totalLoansCount = await Loan.countDocuments({});
      const totalUsersCount = await User.countDocuments({});

      // Define stats object and pass to EJS template
      const stats = {
        pendingLoans: pendingLoansCount,
        approvedLoans: approvedLoansCount,
        totalLoans: totalLoansCount,
        totalUsers: totalUsersCount
      };

      res.render('admin-dashboard', { 
        user: req.session.user,
        stats: stats // Pass stats to the EJS template
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).send('An error occurred while loading the dashboard');
    }
  } else {
    res.status(401).send('Unauthorized');
  }
});

// Routes for the loan management system
app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/loan-request', (req, res) => {
  if (req.session.user) {
    res.render('loan-request');
  } else {
    res.redirect('/login');
  }
});

app.post('/request-loan', async (req, res) => {
  if (req.session.user) {
    const { proof, identification, purpose, amount, income, job, years } = req.body;

    const principal = parseFloat(amount);
    const calculatedInterest = 5 / 100 / 12;  // Assuming a fixed interest rate of 5%
    const calculatedPayment = parseFloat(years) * 12;

    const x = Math.pow(1 + calculatedInterest, calculatedPayment);
    const monthly = (principal * x * calculatedInterest) / (x - 1);
    const totalPayment = monthly * calculatedPayment;
    const totalInterest = totalPayment - principal;

    const repayDate = new Date();
    repayDate.setFullYear(repayDate.getFullYear() + parseInt(years));

    const newLoan = await Loan.create({
      proof,
      identification,
      purpose,
      amount: principal,
      income,
      job,
      interestRate: 5,
      status: 'Pending',
      userId: req.session.user._id,
      requestDate: new Date(),
      repayDate
    });

    res.render('loan-success', { 
      loanId: newLoan._id,
      requestDate: newLoan.requestDate.toDateString(),
      proof: newLoan.proof,
      identification: newLoan.identification,
      purpose: newLoan.purpose,
      job: newLoan.job,
      income: newLoan.income,
      amount: newLoan.amount,
      years: years,
      monthlyPayment: monthly.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2)
    });
  } else {
    res.redirect('/login');
  }
});

app.get('/admin-approve', async (req, res) => {
  if (req.session.user && req.session.user.isAdmin) {
    try {
      const loans = await Loan.find({ status: 'Pending' }).populate('userId');
      res.render('admin-approve', { loans });
    } catch (error) {
      console.error('Error fetching pending loans:', error);
      res.status(500).send('An error occurred while fetching pending loans');
    }
  } else {
    res.send('Unauthorized');
  }
});


app.post('/approve-loan/:loanId', async (req, res) => {
  if (req.session.user && req.session.user.isAdmin) {
    const { loanId } = req.params;
    await Loan.findByIdAndUpdate(loanId, { status: 'Approved' });
    await Transaction.create({ loanId, amount: 0, status: 'Approved' });
    res.redirect('/admin-approve');
  } else {
    res.send('Unauthorized');
  }
});

app.get('/transaction-history', async (req, res) => {
  if (req.session.user) {
    try {
      const transactions = await Transaction.find().populate({
        path: 'loanId',
        populate: { path: 'userId' }
      });
      res.render('transaction-history', { transactions });
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      res.status(500).send('An error occurred while fetching transaction history');
    }
  } else {
    res.redirect('/login');
  }
});



app.get('/track-status', async (req, res) => {
  if (req.session.user) {
    const pendingLoans = await Loan.find({ userId: req.session.user._id, status: 'Pending' });
    res.render('track-status', { loan: null, pendingLoans });
  } else {
    res.redirect('/login');
  }
});

app.post('/track-status', async (req, res) => {
  if (req.session.user) {
    const { loanId } = req.body;
    const loan = await Loan.findById(loanId);
    const pendingLoans = await Loan.find({ userId: req.session.user._id, status: 'Pending' });
    res.render('track-status', { loan, pendingLoans });
  } else {
    res.redirect('/login');
  }
});

app.get('/approved-loans', async (req, res) => {
  if (req.session.user) {
    try {
      const approvedLoans = await Loan.find({ userId: req.session.user._id, status: 'Approved' });
      res.render('approved-loans', { loans: approvedLoans });
    } catch (error) {
      console.error('Error fetching approved loans:', error);
      res.status(500).send('An error occurred while fetching approved loans');
    }
  } else {
    res.redirect('/login');
  }
});



// User registration and login routes
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }
    const newUser = await User.create({ name, email, password, phone });
    req.session.user = newUser;
    res.status(201).render("index", { naming: name });
  } catch (e) {
    console.error('Error during user signup: ', e);
    res.status(500).send("Error during signup");
  }
});

app.get('/index', (req, res) => {
  if (req.session.user) {
    res.render('index', { naming: req.session.user.name });
  } else {
    res.redirect('/login');
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && user.password === password) {
      req.session.user = user;
      res.redirect('/index');
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (e) {
    console.error('Error during login: ', e);
    res.status(500).send('An error occurred during login');
  }
});

app.get('/profile', (req, res) => {
  if (req.session.user) {
    res.render('profile', { user: req.session.user });
  } else {
    res.status(401).send('User not found. Please log in.');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
