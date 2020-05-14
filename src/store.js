import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createRootReducer from './reducers';

export default createStore(createRootReducer, applyMiddleware(thunk));
