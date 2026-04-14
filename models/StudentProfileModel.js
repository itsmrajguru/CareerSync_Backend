const mongoose = require('mongoose');

//Defining profile Schema
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
    birthday: { type: String, default: '' },
    summary: { type: String, default: '' },
    domain: { type: String, default: '' },
    field: { type: String, default: '' },
    website: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    work: { type: String, default: '' },
    education: { type: String, default: '' },
    skills: { type: String, default: '' },
    // change 3 :Added a savedJobs Fields to store the saved jobs
    savedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }]

})

//creating a profileModel
const profileModel = mongoose.model('Profile', profileSchema);

module.exports=profileModel