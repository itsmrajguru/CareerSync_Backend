const Application = require('../../../models/ApplicationModel');

/* function to toggle the save status of an applicant 
   so the company can save or unsave candidates easily from the dashboard */

/* LOGIC : */
const toggleSaveApplicant = async (req, res) => {
    try {
        const { id } = req.params;
        
        /* find the application first to check its current saved state */
        const application = await Application.findById(id);
        
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        /* simple toggle logic to flip the isSaved boolean */
        application.isSaved = !application.isSaved;
        await application.save();

        return res.status(200).json({ 
            success: true, 
            message: application.isSaved ? 'Applicant saved successfully' : 'Applicant removed from saved list',
            isSaved: application.isSaved 
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    }
};

module.exports = toggleSaveApplicant;;
