const NOTIFICATIONS = 'notifications';

/**
 * Creates a message to be pushed to the user.
 */
const NOTIFICATIONS_PUSH_MESSAGE = `${NOTIFICATIONS}/pushMessage`;

/**
 * Clears the specified notification.
 */
const NOTIFICATIONS_CLEAR_MESSAGE = `${NOTIFICATIONS}/clearMessage`;

export { NOTIFICATIONS_PUSH_MESSAGE, NOTIFICATIONS_CLEAR_MESSAGE };
