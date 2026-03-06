const express = require('express');
const router = express.Router();
const multer = require('multer');

// Middleware
const { protect } = require('../middleware/authMiddleware');

// Controllers
const authController = require('../controllers/authController');
const jobController = require('../controllers/jobController');
const profileController = require('../controllers/profileController');
const resumeController = require('../controllers/resumeController');

// Multer Setup (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

// --- Auth Routes ---
router.post('/login/', authController.login);
router.post('/signup/', authController.signup);
router.post('/token/refresh/', authController.refreshToken);
router.post('/verify/:token/', authController.verifyEmail);
router.post('/forgot-password/', authController.forgotPassword);
router.post('/reset-password/', authController.resetPassword);

// --- Job Routes ---
router.get('/jobs/', protect, jobController.getJobs); // Assuming IsAuthenticated in Django

// --- Resume Routes ---
router.post('/resume/upload/', protect, upload.single('resume'), resumeController.uploadResume);

// --- Profile Routes (CRUD) ---
// Django Router: router.register(r'profile', ProfileViewSet)
// Maps to:
// GET /profile/ -> List
// POST /profile/ -> Create
// GET /profile/:id/ -> Retrieve
// PUT /profile/:id/ -> Update
// DELETE /profile/:id/ -> Delete

router.get('/profile/', protect, profileController.getProfiles);
router.post('/profile/', protect, profileController.createProfile);
router.get('/profile/:id/', protect, profileController.getProfile);
router.put('/profile/:id/', protect, profileController.updateProfile);
router.delete('/profile/:id/', protect, profileController.deleteProfile);

module.exports = router;
