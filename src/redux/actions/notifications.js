import { NOTIFICATIONS_CLEAR_MESSAGE, NOTIFICATIONS_PUSH_MESSAGE } from '../actionTypes/notifications';

const pushNotificationMessage = (type, message, time) => (dispatch) => {
  dispatch({
    type: NOTIFICATIONS_PUSH_MESSAGE,
    payload: {
      type,
      message,
      time,
    },
  });

  if (time > 0) {
    setTimeout(() => {
      dispatch({
        type: NOTIFICATIONS_CLEAR_MESSAGE,
      });
    }, time * 1000);
  }
};

export default pushNotificationMessage;
