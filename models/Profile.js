const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // OneToOne relationship
    },
    full_name: { type: String, default: '' },
    gender: { type: String, default: '' },
    location: { type: String, default: '' },
    birthday: { type: String, default: '' }, // Keeping as String to match Django CharField(max_length=100)
    summary: { type: String, default: '' },
    domain: { type: String, default: '' },
    field: { type: String, default: '' },
    website: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    work: { type: String, default: '' },
    education: { type: String, default: '' },
    skills: { type: String, default: '' },
});

module.exports = mongoose.model('Profile', profileSchema);
