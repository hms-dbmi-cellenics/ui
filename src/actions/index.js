import { fetchCellSet } from './actionType';

const fetchCellSetAction = () => ({
  type: fetchCellSet, data: { foo: 'bar' },
});

export { fetchCellSetAction };
