const pdf = require('pdf-parse');

// created a vocabulary
const TECH_SKILLS = [
    "python", "javascript", "react", "django", "node", "sql", "aws", "docker",
    "kubernetes", "git", "html", "css", "java", "c++", "c#", "go", "ruby",
    "php", "swift", "kotlin", "flutter", "typescript", "angular", "vue",
    "machine learning", "data science", "ai", "cloud", "devops", "agile"
];

//here pdf function extracts 
const extractTextFromPDF = async (buffer) => {
    try {
        const data = await pdf(buffer);
        return data.text.trim();
    } catch (error) {
        console.error(`Error extracting PDF text: ${error.message}`);
        return "";
    }
};

const analyzeResume = (text) => {
    if (!text) {
        return {
            score: 0,
            skills_found: [],
            missing_keywords: ["python", "javascript", "react"],
            summary: "No text content found."
        };
    }

    const text_lower = text.toLowerCase();

    // 1. Skill Extraction
    const found_skills = [];
    TECH_SKILLS.forEach(skill => {
        const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i'); // \b word boundary


        if (regex.test(text_lower)) {
            found_skills.push(skill);
        } else {
            // Fallback for tricky symbols like C++, C#
            if ((skill === 'c++' || skill === 'c#') && text_lower.includes(skill)) {
                // simple check to avoid over-complicating regex for this strict port
                if (!found_skills.includes(skill)) found_skills.push(skill);
            }
        }
    });

    // 2. Simple ATS Score Heuristic
    let score = 20;
    score += Math.min(found_skills.length * 5, 50);

    if (/\bexperience\b/i.test(text_lower)) {
        score += 15;
    }
    if (/\b(education|university|college)\b/i.test(text_lower)) {
        score += 15;
    }

    score = Math.min(score, 100);

    // 3. Missing Keywords
    const top_skills = ["python", "javascript", "react", "sql", "git"];
    const missing = top_skills.filter(s => !found_skills.includes(s));

    return {
        score: score,
        skills_found: found_skills.sort(),
        missing_keywords: missing,
        summary: text.substring(0, 500) + "..."
    };
};

module.exports = {
    extractTextFromPDF,
    analyzeResume
};
