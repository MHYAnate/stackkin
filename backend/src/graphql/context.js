// ... existing imports ...
import createAdvertisementLoaders from './loaders/advertisement.loader.js';

const createContext = async ({ req, connection }) => {
  if (connection) {
    // WebSocket connection
    return {
      ...connection.context,
      loaders: {
        ...(connection.context.loaders || {}),
        ...createAdvertisementLoaders()
      }
    };
  }

  // HTTP request
  const token = req.headers.authorization?.replace('Bearer ', '');
  let user = null;
  let loaders = {
    ...createAdvertisementLoaders()
    // Add other loaders here
  };

  if (token) {
    try {
      const decoded = await authService.verifyToken(token);
      user = await userService.getUserById(decoded.userId);
      
      // Add user-specific loaders
      loaders = {
        ...loaders,
        userLoader: new DataLoader(async (userIds) => {
          const users = await User.find({ _id: { $in: userIds } });
          const userMap = {};
          users.forEach(u => {
            userMap[u._id.toString()] = u;
          });
          return userIds.map(id => userMap[id.toString()] || null);
        })
      };
    } catch (error) {
      // Invalid token, proceed without user
    }
  }

  return {
    req,
    user,
    loaders,
    services: {
      authService,
      userService,
      advertisementService,
      campaignService
      // Add other services
    }
  };
};

export default createContext;