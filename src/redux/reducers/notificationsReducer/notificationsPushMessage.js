// import { createHierarchyFromTree, createPropertiesFromTree } from './helpers';

const notificationsPushMessage = (state, action) => {
  const { type, message, time } = action.payload;

  return {
    ...state,
    message: {
      type,
      message,
      time,
    },
  };
};

export default notificationsPushMessage;
