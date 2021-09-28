import initialState from '../../reducers/cellSets/initialState';

const getCellSets = () => (state) => state ?? initialState;
export default getCellSets;
