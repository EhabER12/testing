import notificationService from "../services/notificationService.js";

export const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page, limit } = req.query;
    const result = await notificationService.getUserNotifications(userId, { page, limit });
    
    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: {
        ...result.pagination,
        unreadCount: result.unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const notification = await notificationService.markAsRead(id, userId);
    
    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await notificationService.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    await notificationService.deleteNotification(id, userId);
    
    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    next(error);
  }
};
