const { extractTextFromPDF, analyzeResume } = require('../../../services/resumeService');

const uploadResume = async (req, res) => {
    try {

        //fetch the file from frontend through req.file
        const fileData = req.file

        //validate the req.file
        if (!fileData) {
            return res.status(400).json({
                success: false,
                message: 'No resume file provided'
            });
        }

        //extract text from the pdffile
        const extractedTextfromPdf = await extractTextFromPDF(fileData.buffer)

        if (!extractedTextfromPdf) {
            return res.status(400).json({
                success: false,
                message: 'Could not extract text from PDF'
            });
        }

        //analyze the  pdfFile

        const AnalysedPdf = analyzeResume(extractedTextfromPdf)

        return res.status(200).json({
            success: true,
            message: 'Resume parsed successfully',
            analysis: AnalysedPdf,
            profile_updated: false
        });
    }catch (error) {
        console.debug('[Resume] Upload failed:', error.message);
        return res.status(500).json({
          success: false,
          message: 'server Error'
        });
    }
};

module.exports={uploadResume}
