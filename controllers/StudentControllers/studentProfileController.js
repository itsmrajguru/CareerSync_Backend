const profileModel = require('../../models/studentModels/StudentProfile');

/* This function is a helper function, 
which formats the data compatible for the fronntend...*/

const formatProfile = (profile) => {
    const p = profile.toObject();

    p.id = p._id; //Frontend usually prefer id not _id
    delete p._id;   //frontend dont need _id as well as __v
    delete p.__v;

    if (p.user) {
        p.user.id = p.user._id;
        delete p.user._id;
    }

    return p;
};

// GET all profiles (current user)
const getProfiles = async (req, res) => {
    try {
        // This searches for all available profiles of a indivisual user
        const profiles = await profileModel
            .find({ user: req.user.id })
            .populate('user', 'username email');

        res.json(profiles.map(formatProfile));
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch profiles" });
    }
};

// CREATE profile
const createProfile = async (req, res) => {
    try {
        /* This creates a new model with user data */
        const profile = await profileModel.create({
            ...req.body,   //this attches the upcoming payload
            user: req.user.id  //this attaches the user id with the data
        });

        /* populating the user , so that user info can be added */
        const populated = await profile.populate('user', 'username email');

        /* this formats the data */
        res.status(201).json(formatProfile(populated));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// GET single profile
const getProfile = async (req, res) => {
    try {
        // Seraching the profile though user id in the profileModel
        const profile = await profileModel
            .findOne({ _id: req.params.id, user: req.user.id })
            .populate('user', 'username email');

        if (!profile)
            return res.status(404).json({ message: "Profile not found" });

        res.json(formatProfile(profile));
    } catch (error) {
        res.status(404).json({ message: "Profile not found" });
    }
};

// UPDATE profile
const updateProfile = async (req, res) => {
    try {
        /* Finding the user and update the existing data with
        new data comiing in the request*/
        const profile = await profileModel
            .findOneAndUpdate(
                { _id: req.params.id, user: req.user.id },
                req.body,
                { new: true, runValidators: true }
            )
            .populate('user', 'username email');

        if (!profile)
            return res.status(404).json({ message: "Profile not found" });

        res.json(formatProfile(profile));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE profile
const deleteProfile = async (req, res) => {
    try {
        /* Finding the user and delete the saqved data  */
        const profile = await profileModel.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!profile)
            return res.status(404).json({ message: "Profile not found" });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Failed to delete profile" });
    }
};

module.exports = {
    getProfiles,
    createProfile,
    getProfile,
    updateProfile,
    deleteProfile
};