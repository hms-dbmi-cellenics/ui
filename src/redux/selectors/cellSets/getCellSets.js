import initialState from '../../reducers/cellSets/initialState';

const getCellSets = () => (state) => (Object.keys(state).length ? state : initialState);
export default getCellSets;
