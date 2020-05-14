import { combineReducers } from 'redux';
import { fetchCellSet } from '../actions/actionType';

const fetchCellSetReducer = (state = {}, action) => {
  switch (action.type) {
    case fetchCellSet:
      console.log('lets fetch the Cell Set Data now!');
      // fetching Cell Set
      return state;
    default:
      return state;
  }
};

export default combineReducers({
  fetchCellSetReducer,
});
