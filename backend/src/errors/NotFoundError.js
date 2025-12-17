import AppError from './AppError.js';

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export default NotFoundError;