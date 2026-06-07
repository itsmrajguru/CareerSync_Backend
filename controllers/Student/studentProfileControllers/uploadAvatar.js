const StudentProfile = require('../../../models/StudentProfileModel');
const { uploadToCloudinary } = require('../../../services/cloudinaryService');

/* function to upload the student profile photo to cloudinary
logic : 1)check if the file exists in req.file
        2)upload the file buffer to cloudinary
        3)save the returned cloudinary url to the student profile */
const uploadAvatar = async (req, res) => {
    try {
        /* step 1 :check whether the file was attached to the request or not */
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided.' });
        }

        /* step 2 :upload the buffer to cloudinary and get back the url */
        const { url } = await uploadToCloudinary(
            req.file.buffer,
            'careersync/student-avatars',
            'image'
        );

        /* step 3 :save the cloudinary url to the student profile in the database */
        const profile = await StudentProfile.findOneAndUpdate(
            { user: req.user.id },
            { avatar: url },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Student profile not found.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully.',
            avatarUrl: url
        });
    } catch (e) {
        console.error('uploadAvatar error:', e.message);
        return res.status(500).json({ success: false, message: 'Failed to upload avatar.' });
    }
};

module.exports = { uploadAvatar };
