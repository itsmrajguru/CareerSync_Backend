const CompanyProfile = require('../../../models/CompanyProfileModel');
const { uploadToCloudinary } = require('../../../services/cloudinaryService');

/* function to upload the company logo image to cloudinary and save the url
logic : 1)check if the file exists in req.file
        2)upload the file buffer to cloudinary
        3)save the returned cloudinary url to the company profile */
const uploadLogo = async (req, res) => {
    try {
        /* step 1 :check whether the file was attached to the request or not */
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided.' });
        }

        /* step 2 :upload the buffer to cloudinary and get back the url */
        const { url } = await uploadToCloudinary(
            req.file.buffer,
            'careersync/company-logos',
            'image'
        );

        /* step 3 :save the cloudinary url to the company profile in the database */
        const company = await CompanyProfile.findOneAndUpdate(
            { user: req.user.id },
            { logo: url },
            { new: true }
        );

        if (!company) {
            return res.status(404).json({ success: false, message: 'Company profile not found.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Logo uploaded successfully.',
            logoUrl: url
        });
    } catch (e) {
        console.error('uploadLogo error:', e.message);
        return res.status(500).json({ success: false, message: 'Failed to upload logo.' });
    }
};

module.exports = { uploadLogo };
