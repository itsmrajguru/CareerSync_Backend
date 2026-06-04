const express = require('express');
const companyPostRouter = express.Router();

const {
    createPost,
    getPostsByCompany,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    commentOnPost,
    deleteComment,
    savePost,
    unsavePost,
    getFeed
} = require('../../controllers/Company/companyPostControllers/companyPostController');

const { protect } = require('../../middleware/authMiddleware');
const { isCompany } = require('../../middleware/roleMiddleware');

/* all the post related routes */
companyPostRouter.post('/', protect, isCompany, createPost);
companyPostRouter.get('/feed', protect, getFeed);
companyPostRouter.get('/company/:companyId', protect, getPostsByCompany);
companyPostRouter.put('/:postId', protect, isCompany, updatePost);
companyPostRouter.delete('/:postId', protect, isCompany, deletePost);
companyPostRouter.post('/like', protect, likePost);
companyPostRouter.post('/unlike', protect, unlikePost);
companyPostRouter.post('/comment', protect, commentOnPost);
companyPostRouter.delete('/comment', protect, deleteComment);
companyPostRouter.post('/save', protect, savePost);
companyPostRouter.delete('/save', protect, unsavePost);

module.exports = { companyPostRouter };
