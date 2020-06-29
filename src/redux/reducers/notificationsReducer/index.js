import {
  NOTIFICATIONS_PUSH_MESSAGE, NOTIFICATIONS_CLEAR_MESSAGE,
} from '../../actionTypes/notifications';

import initialState from './initialState';

import notificationsPushMessage from './notificationsPushMessage';
import notificationsClearMessage from './notificationsClearMessage';


const notificationsReducer = (state = initialState, action) => {
  switch (action.type) {
    case NOTIFICATIONS_PUSH_MESSAGE: {
      return notificationsPushMessage(state, action);
    }

    case NOTIFICATIONS_CLEAR_MESSAGE: {
      return notificationsClearMessage(state, action);
    }

    default: {
      return state;
    }
  }
};

export default notificationsReducer;
