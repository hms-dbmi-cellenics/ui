import React from 'react';

import {
  useSelector,
} from 'react-redux';


import {
  message,
} from 'antd';


const NotificationManager = () => {
  const notifications = useSelector((state) => state.notifications);

  if (notifications.message) {
    const { type, message: text, time } = notifications.message;

    switch (type) {
      case 'success':
        message.success(text, time);
        break;
      case 'error':
        message.error(text, time);
        break;
      case 'info':
        message.info(text, time);
        break;
      case 'warning':
      case 'warn':
        message.warn(text, time);
        break;
      case 'loading':
        message.loading(text, time);
        break;
      default:
        message.info(text, time);
        break;
    }
  }

  return (<></>);
};

export default NotificationManager;
