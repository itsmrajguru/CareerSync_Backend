const CompanyPost = require('../../../models/CompanyPostModel');
const CompanyProfile = require('../../../models/CompanyProfileModel');
const CompanyFollower = require('../../../models/CompanyFollowersModel');
const Profile = require('../../../models/StudentProfileModel');
const User = require('../../../models/AuthModels/UserModel');

/* this creates a new post for the company profile */
const createPost = async (req, res) => {
    try {
        const { title, description, postType, image, video, externalLink } = req.body;
        const company = await CompanyProfile.findOne({ user: req.user.id });
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
        }

        const post = await CompanyPost.create({
            company: company._id,
            postType,
            title,
            description,
            image: image || '',
            video: video || '',
            externalLink: externalLink || ''
        });

        res.status(201).json({
            success: true,
            post
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

/* this function gets all the posts published by a specific company */
const getPostsByCompany = async (req, res) => {
    try {
        let { companyId } = req.params;

        if (companyId === 'me') {
            const companyProfile = await CompanyProfile.findOne({ user: req.user.id });
            if (!companyProfile) {
                return res.status(404).json({ success: false, message: 'Company profile not found' });
            }
            companyId = companyProfile._id;
        }

        const posts = await CompanyPost.find({ company: companyId })
            .populate('company', 'name logo')
            .populate('comments.user', 'username role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            posts
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

/* update an existing post if the company owns it */
const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const company = await CompanyProfile.findOne({ user: req.user.id });
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
        }

        const post = await CompanyPost.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (post.company.toString() !== company._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to edit this post'
            });
        }

        const updated = await CompanyPost.findByIdAndUpdate(postId, req.body, { new: true });
        res.status(200).json({
            success: true,
            post: updated
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

/* function to delete a post that belongs to this company */
const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const company = await CompanyProfile.findOne({ user: req.user.id });
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
        }

        const post = await CompanyPost.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (post.company.toString() !== company._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this post'
            });
        }

        await CompanyPost.findByIdAndDelete(postId);
        res.status(200).json({
            success: true,
            message: 'Post deleted'
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

/* student likes a post using this function */
const likePost = async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user.id;

        const post = await CompanyPost.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (post.likes.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Post already liked'
            });
        }

        post.likes.push(userId);
        post.reach = (post.reach || 0) + 1;
        await post.save();

        res.status(200).json({
            success: true,
            message: 'Post liked',
            likesCount: post.likes.length
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

/* student unlikes a post */
const unlikePost = async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user.id;

        const post = await CompanyPost.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        post.likes = post.likes.filter(id => id.toString() !== userId);
        await post.save();

        res.status(200).json({
            success: true,
            message: 'Post unliked',
            likesCount: post.likes.length
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

/* student adds a comment on the company post */
const commentOnPost = async (req, res) => {
    try {
        const { postId, text } = req.body;
        const userId = req.user.id;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required'
            });
        }

        const post = await CompanyPost.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        post.comments.push({ user: userId, text });
        post.reach = (post.reach || 0) + 1;
        await post.save();

        const updatedPost = await CompanyPost.findById(postId)
            .populate('comments.user', 'username role');

        res.status(200).json({
            success: true,
            comments: updatedPost.comments
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

/* deleting a comment from a post */
const deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.body;
        const userId = req.user.id;

        const post = await CompanyPost.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        /* check if the user is the one who made the comment or the company that made the post */
        const company = await CompanyProfile.findOne({ user: userId });
        const isPostOwner = company && post.company.toString() === company._id.toString();
        const isCommentOwner = comment.user.toString() === userId;

        if (!isCommentOwner && !isPostOwner) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete comment'
            });
        }

        post.comments = post.comments.filter(c => c._id.toString() !== commentId);
        await post.save();

        res.status(200).json({
            success: true,
            message: 'Comment deleted',
            comments: post.comments
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

/* so here a student can save a post to their profile */
const savePost = async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user.id;

        const profile = await Profile.findOne({ user: userId });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        if (profile.savedPosts.includes(postId)) {
            return res.status(400).json({
                success: false,
                message: 'Post already saved'
            });
        }

        profile.savedPosts.push(postId);
        await profile.save();

        /* keeping track of how many people saved the post */
        await CompanyPost.findByIdAndUpdate(postId, { $addToSet: { saves: userId } });

        res.status(200).json({
            success: true,
            message: 'Post saved'
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

/* removing the saved post from student profile */
const unsavePost = async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user.id;

        const profile = await Profile.findOne({ user: userId });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        profile.savedPosts = profile.savedPosts.filter(id => id.toString() !== postId);
        await profile.save();

        /* removing the track for saved post */
        await CompanyPost.findByIdAndUpdate(postId, { $pull: { saves: userId } });

        res.status(200).json({
            success: true,
            message: 'Post unsaved'
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

/* fetching the recommended feed for a student */
const getFeed = async (req, res) => {
    try {
        const studentId = req.user.id;
        const sortBy = req.query.sortBy || 'latest'; // latest, likes, comments, trending

        /* get the list of companies student already follows */
        const follows = await CompanyFollower.find({ studentId });
        const followedCompanyIds = follows.map(f => f.companyId);

        /* recommending the companies based on same industry */
        const studentProfile = await Profile.findOne({ user: studentId });
        const domain = studentProfile ? studentProfile.domain : '';

        let recommendedCompanyIds = [];
        if (domain) {
            const recommendedCompanies = await CompanyProfile.find({
                industry: { $regex: domain, $options: 'i' },
                _id: { $nin: followedCompanyIds }
            }).limit(10);
            recommendedCompanyIds = recommendedCompanies.map(c => c._id);
        }

        /* picking up the trending companies with highest views */
        const trendingCompanies = await CompanyProfile.find({
            _id: { $nin: [...followedCompanyIds, ...recommendedCompanyIds] }
        }).sort({ views: -1 }).limit(10);
        const trendingCompanyIds = trendingCompanies.map(c => c._id);

        let posts = await CompanyPost.find()
            .populate('company', 'name logo industry location followersCount')
            .populate('comments.user', 'username role')
            .lean();

        /* scoring the posts so we can rank them */
        posts = posts.map(post => {
            let score = 0;
            const companyIdStr = post.company?._id?.toString();

            if (followedCompanyIds.some(id => id.toString() === companyIdStr)) {
                score += 70; // 70% followed
            } else if (recommendedCompanyIds.some(id => id.toString() === companyIdStr)) {
                score += 20; // 20% recommended
            } else if (trendingCompanyIds.some(id => id.toString() === companyIdStr)) {
                score += 10; // 10% trending
            }

            const likesCount = post.likes ? post.likes.length : 0;
            const commentsCount = post.comments ? post.comments.length : 0;
            score += (likesCount * 2) + (commentsCount * 5);

            /* check if this student has already liked or saved it */
            const isLiked = post.likes?.some(id => id.toString() === studentId) || false;
            const isSaved = post.saves?.some(id => id.toString() === studentId) || false;

            return {
                ...post,
                isLiked,
                isSaved,
                recommendationScore: score,
                likesCount,
                commentsCount
            };
        });

        /* finally sort all the posts based on the requested filter */
        if (sortBy === 'latest') {
            posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'likes') {
            posts.sort((a, b) => b.likesCount - a.likesCount);
        } else if (sortBy === 'comments') {
            posts.sort((a, b) => b.commentsCount - a.commentsCount);
        } else if (sortBy === 'trending') {
            posts.sort((a, b) => b.recommendationScore - a.recommendationScore);
        }

        res.status(200).json({
            success: true,
            posts
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

module.exports = {
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
};
