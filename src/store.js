import { createStore } from 'redux';
import createRootReducer from './reducers';

export default createStore(createRootReducer);
