const Profile = require('../models/Profile');
const User = require('../models/User'); // Required to populate user if needed, but serializer usually just gives user ID or object

// GET /api/profile/
const getProfiles = async (req, res) => {
    try {
        const populatedProfiles = await Profile.find({ user: req.user._id }).populate('user', 'id username email');

        // Map Mongoose _id to Django id format

        const formattedProfiles = populatedProfiles.map(profile => {
            const p = profile.toObject();
            p.id = p._id; // Map _id to id
            delete p._id;
            delete p.__v;

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
        res.status(500).json({ error: "Server Error" });
    }
};

// POST /api/profile/
const createProfile = async (req, res) => {
    try {
        const profileData = { ...req.body, user: req.user._id };
        const profile = await Profile.create(profileData);

        const p = await Profile.findById(profile._id).populate('user', 'id username email');
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
        res.status(400).json({ error: "Invalid data" });
    }
};

// GET /api/profile/:id/
const getProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ _id: req.params.id, user: req.user._id }).populate('user', 'id username email');

        if (!profile) {
            return res.status(404).json({ detail: "Not found." });
        }

        const formatted = profile.toObject();
        formatted.id = formatted._id;
        delete formatted._id;
        delete formatted.__v;
        if (formatted.user) {
            formatted.user.id = formatted.user._id;
            delete formatted.user._id;
        }

        res.json(formatted);
    } catch (error) {
        console.error('[Profile] detail error:', error);
        res.status(404).json({ detail: "Not found." });
    }
};

// PUT /api/profile/:id/
const updateProfile = async (req, res) => {
    try {
        let profile = await Profile.findOne({ _id: req.params.id, user: req.user._id });

        if (!profile) {
            return res.status(404).json({ detail: "Not found." });
        }

        profile = await Profile.findByIdAndUpdate(req.params.id, req.body, {
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

        res.json(formatted);
    } catch (error) {
        console.error('[Profile] update error:', error);
        res.status(400).json({ error: "Invalid data" });
    }
};

// DELETE /api/profile/:id/
const deleteProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ _id: req.params.id, user: req.user._id });

        if (!profile) {
            return res.status(404).json({ detail: "Not found." });
        }

        await profile.remove();
        res.status(204).json({});
    } catch (error) {
        console.error('[Profile] delete error:', error);
        // Fallback to deleteOne if remove() is deprecated
        await Profile.deleteOne({ _id: req.params.id });
        res.status(204).json({});
    }
};

module.exports = {
    getProfiles,
    createProfile,
    getProfile,
    updateProfile,
    deleteProfile
};
