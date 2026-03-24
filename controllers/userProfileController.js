const profileModel = require('../models/Profile');
const userModel = require('../models/User'); // Required to populate user if needed, but serializer usually just gives user ID or object

// GET /api/profile/
const getProfiles = async (req, res) => {
    try {
        const populatedProfiles = await profileModel.find({ user: req.user.id }).populate('user', 'id username email');

        const formattedProfiles = populatedProfiles.map(profile => {
            const p = profile.toObject();
            p.id = p._id; // Map _id to id
            delete p._id;
            delete p.__v;

            if (p.user) {
                p.user.id = p.user._id;
                delete p.user._id;
            }
            return p;
        });

        res.json(formattedProfiles);
    } catch (error) {
        console.error('[Profile] list error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch profiles" 
        });
    }
};

// POST /api/profile/
const createProfile = async (req, res) => {
    try {
        const profileData = { ...req.body, user: req.user.id };
        const profile = await profileModel.create(profileData);

        const p = await profileModel.findById(profile._id).populate('user', 'id username email');
        const formatted = p.toObject();
        formatted.id = formatted._id;
        delete formatted._id;
        delete formatted.__v;
        if (formatted.user) {
            formatted.user.id = formatted.user._id;
            delete formatted.user._id;
        }
        res.status(201).json(formatted);
    } catch (error) {
        console.error('[Profile] create error:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message || "Invalid profile data" 
        });
    }
};

// GET /api/profile/:id/
const getProfile = async (req, res) => {
    try {
        const profile = await profileModel.findOne({ _id: req.params.id, user: req.user.id }).populate('user', 'id username email');

        if (!profile) {
            return res.status(404).json({ 
                success: false, 
                message: "Profile not found" 
            });
        }

        const formatted = profile.toObject();
        formatted.id = formatted._id;
        delete formatted._id;
        delete formatted.__v;
        if (formatted.user) {
            formatted.user.id = formatted.user._id;
            delete formatted.user._id;
        }

        res.json({
            success: true,
            ...formatted
        });
    } catch (error) {
        console.error('[Profile] detail error:', error);
        res.status(404).json({ 
            success: false, 
            message: "Profile not found or error fetching details" 
        });
    }
};

// PUT /api/profile/:id/
const updateProfile = async (req, res) => {
    try {
        let profile = await profileModel.findOne({ _id: req.params.id, user: req.user.id });

        if (!profile) {
            return res.status(404).json({ 
                success: false, 
                message: "Profile not found" 
            });
        }

        profile = await profileModel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('user', 'id username email');

        const formatted = profile.toObject();
        formatted.id = formatted._id;
        delete formatted._id;
        delete formatted.__v;
        if (formatted.user) {
            formatted.user.id = formatted.user._id;
            delete formatted.user._id;
        }

        res.json({
            success: true,
            message: "Profile updated successfully",
            ...formatted
        });
    } catch (error) {
        console.error('[Profile] update error:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message || "Failed to update profile" 
        });
    }
};

// DELETE /api/profile/:id/
const deleteProfile = async (req, res) => {
    try {
        const profile = await profileModel.findOne({ _id: req.params.id, user: req.user.id });

        if (!profile) {
            return res.status(404).json({ 
                success: false, 
                message: "Profile not found" 
            });
        }

        await profile.deleteOne();
        res.status(204).json({});
    } catch (error) {
        console.error('[Profile] delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete profile'
        });
    }
};

module.exports = {
    getProfiles,
    createProfile,
    getProfile,
    updateProfile,
    deleteProfile
};
