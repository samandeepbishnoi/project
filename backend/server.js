import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jewelry-catalog', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  description: { type: String, required: true },
  inStock: { type: Boolean, default: true },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Admin User Schema
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['main', 'pending', 'approved'], default: 'pending' },
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

// Store Status Schema
const storeStatusSchema = new mongoose.Schema({
  status: { type: String, enum: ['online', 'offline'], default: 'online' },
  updatedAt: { type: Date, default: Date.now },
});

const StoreStatus = mongoose.model('StoreStatus', storeStatusSchema);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Main admin middleware
const authenticateMainAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    if (user.role !== 'main') {
      return res.status(403).json({ message: 'Access denied. Main admin privileges required.' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Admin Authentication
app.post('/api/admin/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin with pending status
    const admin = new Admin({
      email,
      password: hashedPassword,
      name,
      role: 'pending',
    });

    await admin.save();

    res.status(201).json({ message: 'Registration submitted. Please wait for approval from the main admin.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    // Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if admin is approved
    if (admin.role === 'pending') {
      return res.status(403).json({ message: 'Your account is pending approval. Please wait for the main admin to approve your registration.' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Product Routes

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { category, tags, minPrice, maxPrice, search } = req.query;
    
    let filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (tags) {
      const tagArray = tags.split(',');
      filter.tags = { $in: tagArray };
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create product (Admin only)
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { name, price, image, category, tags, description, inStock } = req.body;
    
    const product = new Product({
      name,
      price,
      image,
      category,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
      description,
      inStock,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product (Admin only)
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { name, price, image, category, tags, description, inStock } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price,
        image,
        category,
        tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
        description,
        inStock,
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product (Admin only)
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Image upload endpoint
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get product categories and tags
app.get('/api/filters', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const tags = await Product.distinct('tags');

    res.json({ categories, tags });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Management Routes

// Get pending admins (Main admin only)
app.get('/api/admin/pending', authenticateMainAdmin, async (req, res) => {
  try {
    const pendingAdmins = await Admin.find({ role: 'pending' }).select('-password');
    res.json(pendingAdmins);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all admins (Main admin only)
app.get('/api/admin/all', authenticateMainAdmin, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve admin (Main admin only)
app.put('/api/admin/approve/:id', authenticateMainAdmin, async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { role: 'approved' },
      { new: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ message: 'Admin approved successfully', admin });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject/Delete pending admin (Main admin only)
app.delete('/api/admin/reject/:id', authenticateMainAdmin, async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ message: 'Admin registration rejected and removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete any admin (Main admin only, cannot delete self)
app.delete('/api/admin/:id', authenticateMainAdmin, async (req, res) => {
  try {
    const targetAdmin = await Admin.findById(req.params.id);

    if (!targetAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (targetAdmin._id.toString() === req.user.adminId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    if (targetAdmin.role === 'main') {
      return res.status(403).json({ message: 'Cannot delete main admin account' });
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Store Status Routes

// Get store status (Public)
app.get('/api/store/status', async (req, res) => {
  try {
    let storeStatus = await StoreStatus.findOne();

    if (!storeStatus) {
      storeStatus = new StoreStatus({ status: 'online' });
      await storeStatus.save();
    }

    res.json({ status: storeStatus.status, updatedAt: storeStatus.updatedAt });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update store status (Main admin only)
app.put('/api/store/status', authenticateMainAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['online', 'offline'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "online" or "offline"' });
    }

    let storeStatus = await StoreStatus.findOne();

    if (!storeStatus) {
      storeStatus = new StoreStatus({ status });
    } else {
      storeStatus.status = status;
      storeStatus.updatedAt = new Date();
    }

    await storeStatus.save();
    res.json({ message: 'Store status updated successfully', status: storeStatus.status });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Jewelry Catalog API is running' });
});

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const defaultAdmin = new Admin({
        email: 'admin@elegance.com',
        password: hashedPassword,
        name: 'Main Admin',
        role: 'main',
      });
      await defaultAdmin.save();
      console.log('Default main admin user created: admin@elegance.com / admin123');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await createDefaultAdmin();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();