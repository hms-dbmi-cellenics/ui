import initialState from './initialState';

const notificationsClearMessage = (state) => (
  { ...state, message: initialState.message }
);

export default notificationsClearMessage;
