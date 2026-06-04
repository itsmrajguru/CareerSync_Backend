const mongoose = require('mongoose');

// company post schema
const postSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    postType: {
        type: String,
        enum: ['Announcement', 'Hiring Update', 'Product Launch', 'Achievement', 'Event', 'Webinar', 'Internship Drive', 'Funding News'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    video: {
        type: String,
        default: ''
    },
    externalLink: {
        type: String,
        default: ''
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId()
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    sharesCount: {
        type: Number,
        default: 0
    },
    saves: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reach: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const CompanyPost = mongoose.model('CompanyPost', postSchema);
module.exports = CompanyPost;
