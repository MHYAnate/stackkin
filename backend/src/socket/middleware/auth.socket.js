import { authService } from '../../services/index.js';
import logger from '../../config/logger.js';

const authSocketMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                 socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      socket.user = null;
      return next();
    }
    
    const decoded = await authService.verifyToken(token);
    
    if (decoded) {
      const user = await authService.getUserById(decoded.userId);
      
      if (user && user.accountStatus === 'ACTIVE') {
        socket.user = user;
        socket.userId = user._id.toString();
        
        // Update last active time
        await authService.updateUserLastActive(user._id);
        
        logger.debug(`Socket authenticated: ${socket.id} (User: ${user._id})`);
        return next();
      }
    }
    
    socket.user = null;
    next(new Error('Authentication failed'));
    
  } catch (error) {
    logger.error('Socket auth middleware error:', error);
    socket.user = null;
    next(new Error('Authentication error'));
  }
};

export default authSocketMiddleware;