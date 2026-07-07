const { Performance, User, KRA, Goal } = require('../models');
const { success, error } = require('../utils/response');

const getReviews = async (req, res) => {
  try {
    const { userId, year, reviewType } = req.query;
    const where = {};

    if (req.user.role === 'employee') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (year) where.year = year;
    if (reviewType) where.reviewType = reviewType;

    const reviews = await Performance.findAll({
      where,
      include: [
        { model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'avatar', 'designation'] },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['year', 'DESC'], ['createdAt', 'DESC']],
    });
    return success(res, reviews);
  } catch (err) {
    return error(res, 'Failed to fetch reviews', 500);
  }
};

const getReviewById = async (req, res) => {
  try {
    const review = await Performance.findByPk(req.params.id, {
      include: [
        { model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'avatar', 'designation', 'departmentId'] },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });
    if (!review) return error(res, 'Review not found', 404);
    return success(res, review);
  } catch (err) {
    return error(res, 'Failed to fetch review', 500);
  }
};

// Admin/Manager creates a review cycle for an employee
const createReview = async (req, res) => {
  try {
    const { userId, reviewType, quarter, year } = req.body;

    const existing = await Performance.findOne({ where: { userId, reviewType, quarter: quarter || null, year } });
    if (existing) return error(res, 'Review already exists for this period', 409);

    const review = await Performance.create({
      userId,
      reviewerId: req.user.id,
      reviewType,
      quarter,
      year,
      status: 'draft',
    });
    return success(res, review, 'Review created', 201);
  } catch (err) {
    return error(res, 'Failed to create review', 500);
  }
};

// Employee submits self-assessment
const submitSelfAssessment = async (req, res) => {
  try {
    const review = await Performance.findByPk(req.params.id);
    if (!review) return error(res, 'Review not found', 404);
    if (review.userId !== req.user.id) return error(res, 'Not your review', 403);
    if (review.status !== 'draft') return error(res, 'Already submitted', 400);

    const { selfRating, selfAssessment } = req.body;
    await review.update({ selfRating, selfAssessment, status: 'submitted' });
    return success(res, review, 'Self assessment submitted');
  } catch (err) {
    return error(res, 'Failed to submit assessment', 500);
  }
};

// Manager completes the review
const completeReview = async (req, res) => {
  try {
    const review = await Performance.findByPk(req.params.id);
    if (!review) return error(res, 'Review not found', 404);
    if (!['submitted', 'draft'].includes(review.status)) {
      return error(res, 'Review already completed', 400);
    }

    const { managerRating, managerFeedback, strengths, improvements } = req.body;

    // Final score = average of self + manager (or just manager if no self-rating)
    const selfScore = review.selfRating || managerRating;
    const finalScore = ((parseFloat(selfScore) + parseFloat(managerRating)) / 2).toFixed(1);

    await review.update({
      managerRating,
      managerFeedback,
      strengths,
      improvements,
      finalScore,
      reviewerId: req.user.id,
      status: 'completed',
    });

    return success(res, review, 'Review completed');
  } catch (err) {
    return error(res, 'Failed to complete review', 500);
  }
};

module.exports = { getReviews, getReviewById, createReview, submitSelfAssessment, completeReview };
