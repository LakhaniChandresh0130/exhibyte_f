const AppError = require("./../utils/appError");
const validate = (schema, payload, next) => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    
    const errors = {};

    result.error.issues.forEach((issue) => {
        const field = issue.path.join(".");

        if (!errors[field]) {
            errors[field] = [];
        }

        errors[field].push(issue.message);
    });

    return next(new AppError(JSON.stringify(errors), 400));
  }
  return result.data;
};

module.exports = validate;