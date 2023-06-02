import { getCellSetKey } from 'utils/cellSets';

const generateDiffExprBody = (experimentId, comparisonGroup, comparisonType, extras) => ({
  name: 'DifferentialExpression',
  experimentId,
  cellSet: getCellSetKey(comparisonGroup.cellSet),
  compareWith: getCellSetKey(comparisonGroup.compareWith),
  basis: getCellSetKey(comparisonGroup.basis),
  comparisonType,
  ...extras,
});

export default generateDiffExprBody;
