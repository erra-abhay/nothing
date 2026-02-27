const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Login validation
const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required')
        .isLength({ max: 255 })
        .withMessage('Email too long'),
    body('password')
        .isString()
        .isLength({ min: 1, max: 255 })
        .withMessage('Password is required'),
    handleValidationErrors
];

// Password strength validation (for registration/password change)
const validatePassword = [
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/)
        .withMessage('Password must contain at least one special character'),
    handleValidationErrors
];

// Faculty creation validation (relaxed password requirements)
const validateFacultyCreation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Name must be between 2 and 255 characters')
        .matches(/^[a-zA-Z\s.'-]+$/)
        .withMessage('Name contains invalid characters'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required')
        .isLength({ max: 255 })
        .withMessage('Email too long'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/[a-zA-Z]/)
        .withMessage('Password must contain at least one letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),
    body('department_id')
        .isInt({ min: 1 })
        .withMessage('Valid department ID is required'),
    handleValidationErrors
];

// Department validation
const validateDepartment = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Department name must be between 2 and 255 characters')
        .matches(/^[a-zA-Z\s&()-]+$/)
        .withMessage('Department name contains invalid characters'),
    body('code')
        .trim()
        .isLength({ min: 2, max: 20 })
        .withMessage('Department code must be between 2 and 20 characters')
        .matches(/^[A-Za-z0-9]+$/)
        .withMessage('Department code must contain only letters and numbers'),
    handleValidationErrors
];

// Subject validation (relaxed)
const validateSubject = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Subject name must be between 2 and 255 characters'),
    body('code')
        .trim()
        .isLength({ min: 2, max: 20 })
        .withMessage('Subject code must be between 2 and 20 characters')
        .matches(/^[A-Za-z0-9-]+$/)
        .withMessage('Subject code must contain only letters, numbers, and hyphens'),
    body('department_id')
        .isInt({ min: 1 })
        .withMessage('Valid department ID is required'),
    handleValidationErrors
];

// Paper upload validation
const validatePaperUpload = [
    body('subject_id')
        .isInt({ min: 1 })
        .withMessage('Valid subject ID is required'),
    body('semester')
        .isInt({ min: 1, max: 8 })
        .withMessage('Semester must be between 1 and 8'),
    body('paper_type')
        .isIn(['MSE-1', 'MSE-2', 'ESE', 'Quiz', 'Assignment', 'Other'])
        .withMessage('Invalid paper type'),
    body('year')
        .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
        .withMessage('Invalid year'),
    handleValidationErrors
];

// Paper update validation
const validatePaperUpdate = [
    body('subject_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Valid subject ID is required'),
    body('semester')
        .optional()
        .isInt({ min: 1, max: 8 })
        .withMessage('Semester must be between 1 and 8'),
    body('paper_type')
        .optional()
        .isIn(['MSE-1', 'MSE-2', 'ESE', 'Quiz', 'Assignment', 'Other'])
        .withMessage('Invalid paper type'),
    body('year')
        .optional()
        .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
        .withMessage('Invalid year'),
    handleValidationErrors
];

// ID parameter validation
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Valid ID is required'),
    handleValidationErrors
];

// Search query validation
const validateSearch = [
    query('q')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Search query too long')
        .matches(/^[a-zA-Z0-9\s-]+$/)
        .withMessage('Search query contains invalid characters'),
    handleValidationErrors
];

// Pagination validation
const validatePagination = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be non-negative'),
    handleValidationErrors
];

// Sanitize HTML to prevent XSS
const sanitizeHtml = (text) => {
    if (typeof text !== 'string') return text;
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

module.exports = {
    validateLogin,
    validatePassword,
    validateFacultyCreation,
    validateDepartment,
    validateSubject,
    validatePaperUpload,
    validatePaperUpdate,
    validateId,
    validateSearch,
    validatePagination,
    handleValidationErrors,
    sanitizeHtml
};
