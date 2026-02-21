const pdf = require('pdf-parse');

const TECH_SKILLS = [
    "python", "javascript", "react", "django", "node", "sql", "aws", "docker",
    "kubernetes", "git", "html", "css", "java", "c++", "c#", "go", "ruby",
    "php", "swift", "kotlin", "flutter", "typescript", "angular", "vue",
    "machine learning", "data science", "ai", "cloud", "devops", "agile"
];

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
        // Regex word boundary matching
        // Escape check for special chars just in case (e.g. c++)
        const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i'); // \b word boundary
        // Note: 'c++' with \b might be tricky in JS regex depending on engine, 
        // but `\b` matches between word char and non-word char. + is non-word.
        // So `c++` \b might generally work or fail depending on if + is considered part of word (it isn't).
        // Let's stick to standard behavior. JS \b matches [a-zA-Z0-9_] vs others.
        // So \bc\+\+\b:
        // " c++ " -> space is non-word, c is word. Match start.
        // last + is non-word. space is non-word. \b matches between word and non-word.
        // So \b matches "c" start. End \b matches between "+" and " ".
        // Wait, + is non-word. So "++ " is non-word to non-word. No boundary there?
        // Actually boundaries are complex. 
        // Let's us simple includes for C++ / C# to be safe or use the python logic replication.
        // Python `re.search(r'\b' + re.escape(skill) + r'\b', text_lower)`
        // Python `\b` is aware of alphanumeric + underscore.

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
