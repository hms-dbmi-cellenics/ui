import { setComparisonGroup } from 'redux/actions/differentialExpression';
import { getCellSetKey } from 'utils/cellSets';

const unselectDeletedOption = (
  comparisonGroup,
  comparisonType,
  properties,
  dispatch,
) => {
  const deleteKeys = {};

  Object.entries(comparisonGroup[comparisonType]).forEach(([comparisonKey, cellSetKey]) => {
    if (!cellSetKey) return;

    const sampleKey = getCellSetKey(cellSetKey);

    if (['all', 'background', 'rest'].includes(sampleKey)) return;
    if (!properties[sampleKey]) deleteKeys[comparisonKey] = null;
  });

  if (!Object.keys(deleteKeys).length) return;

  dispatch(
    setComparisonGroup({
      type: comparisonType,
      ...comparisonGroup[comparisonType],
      ...deleteKeys,
    }),
  );
};

export default unselectDeletedOption;
