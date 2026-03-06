const { extractTextFromPDF, analyzeResume } = require('../services/resumeService');

// POST /api/resume/upload/
const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No resume file provided" });
        }

        const text = await extractTextFromPDF(req.file.buffer);

        if (!text) {
            return res.status(400).json({ error: "Could not extract text from PDF" });
        }

        const analysis = analyzeResume(text);

        // Intentionally skip profile DB update (mirrors Django logic)
        res.json({
            message: "Resume parsed successfully",
            analysis: analysis,
            profile_updated: false
        });

    } catch (error) {
        console.debug('[Resume] Upload failed:', error.message);
        res.status(500).json({ error: "Server Error" });
    }
};

module.exports = { uploadResume };
