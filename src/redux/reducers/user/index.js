import {
  USER_LOADED,
} from 'redux/actionTypes/user';

import initialState from 'redux/reducers/user/initialState';
import userLoaded from 'redux/reducers/user/userLoaded';

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case USER_LOADED: {
      return userLoaded(state, action);
    }

    default: {
      return state;
    }
  }
};

export default userReducer;
