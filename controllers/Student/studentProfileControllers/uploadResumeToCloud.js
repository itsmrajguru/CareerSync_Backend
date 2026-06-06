const StudentProfile = require('../../../models/StudentProfileModel');
const { uploadToCloudinary } = require('../../../services/cloudinaryService');

const uploadResumeToCloud = async (req, res) => {
    try {
        /* step 1 :check whether the pdf file was attached to the request or not */
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No PDF file provided.' });
        }

        /* step 2 :upload the pdf buffer to cloudinary as a raw resource type */
        const { url } = await uploadToCloudinary(
            req.file.buffer,
            'careersync/resumes',
            'raw'
        );

        /* step 3 :save the cloudinary url to the student profile in the database */
        const profile = await StudentProfile.findOneAndUpdate(
            { user: req.user.id },
            { resumeUrl: url },
            { new: true }
        );

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Student profile not found.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Resume uploaded successfully.',
            resumeUrl: url
        });
    } catch (e) {
        console.error('uploadResumeToCloud error:', e.message);
        return res.status(500).json({ success: false, message: 'Failed to upload resume.' });
    }
};

module.exports = { uploadResumeToCloud };
