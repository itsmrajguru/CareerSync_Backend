const profileModel = require('../../../models/StudentProfileModel');

/*This function acts as a bridge between the mongoDB and the react app
because it acts as a translator between them */

/* This funnction is must have in the profile page,
otherwise you can not perform opeartions like update,delete 
before sending the data to the frontend*/

const formatProfile = (profile) => {
    /* this .toObject() converts the mongoDB document into a plain javascript object
    which utlimately helps to perform operations on it */
    const p = profile.toObject();

    p.id = p._id;   //Frontend usually prefer id not _id
    delete p._id;   //frontend dont need _id as well as __v
    delete p.__v;

    if (p.user) {
        if (p.user._id) {
            p.user.id = p.user._id;
            delete p.user._id;
        }
    }

    return p;
};

// Create or Upsert a student profile
const createProfile = async (req, res) => {
    try {
        /* This creates a new model with user data */
        /* This uses findOneAndUpdate with upsert: true to safely handle
           both creation and accidental duplicate creation attempts */
        const profile = await profileModel.findOneAndUpdate(
            { user: req.user.id },
            { 
               ...req.body,       //this attches the incoming payload from req.body
               user: req.user.id  //this attaches the user id with the data
            },
            { new: true, upsert: true, runValidators: true }
        ).populate('user', 'username email');

        /* Before populate
        user: "64abc123"
        
        After populate
        user: {
            id: "64abc123",
            username: "rahul_sharma",
            email: "rahul@gmail.com"
        }
        */
        /* In short we are merging extra info along with existing userId*/

        /* this formats the data */
        res.status(201).json(formatProfile(profile));  //this runs the formatProfile function
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
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

// GET my own profile — used by the /me route (student fetching their own data)
const getMyProfile = async (req, res) => {
    try {
        //directly search using the logged-in user's id from the token
        const profile = await profileModel
            .findOne({ user: req.user.id })
            .populate('user', 'username email');

        if (!profile)
            return res.status(404).json({ message: "Profile not found" });

        res.json(formatProfile(profile));
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};

// GET a profile by ID — used by the /:id route (admin or company viewing a specific student)
const getProfileById = async (req, res) => {
    try {
        //search by the mongodb _id coming from the url params
        const profile = await profileModel
            .findById(req.params.id)
            .populate('user', 'username email');

        if (!profile)
            return res.status(404).json({ message: "Profile not found" });

        res.json(formatProfile(profile));
    } catch (error) {
        res.status(404).json({ message: "Profile not found" });
    }
};

// UPDATE my own profile — used by the /me route
const updateMyProfile = async (req, res) => {
    try {
        /* Finding the user and update the existing data with
        new data comiing in the request*/
        const profile = await profileModel
            .findOneAndUpdate(
                { user: req.user.id },
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

// DELETE my own profile — used by the /me route
const deleteMyProfile = async (req, res) => {
    try {
        /* Finding the user and delete the saqved data  */
        const profile = await profileModel.findOneAndDelete({ user: req.user.id });

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
    getMyProfile,
    getProfileById,
    updateMyProfile,
    deleteMyProfile
};
