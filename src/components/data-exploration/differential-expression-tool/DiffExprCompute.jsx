import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';

import {
  Button, Form, Select, Radio, Tooltip, Space, Alert
} from 'antd';

import { InfoCircleOutlined } from '@ant-design/icons';

import PropTypes from 'prop-types';
import { loadCellSets } from 'redux/actions/cellSets';
import { setComparisonGroup, setComparisonType } from 'redux/actions/differentialExpression';
import { getCellSets } from 'redux/selectors';
import { composeTree } from 'utils/cellSets';

const { Option, OptGroup } = Select;

const ComparisonType = Object.freeze({ BETWEEN: 'between', WITHIN: 'within' });
const getCellSetKey = (name) => (name?.split('/')[1] || name);
const getRootKey = (name) => name?.split('/')[0];

const MIN_NUM_CELLS_IN_GROUP = 10;
const MIN_NUM_SAMPLES_SHOW_ERROR = 2;
const MIN_NUM_SAMPLES_SHOW_WARNING = 3;

const canRunDiffExprResults = {
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  WARNING: 'WARNING',
  ERROR: 'ERROR'
}

const DiffExprCompute = (props) => {
  const {
    experimentId, onCompute,
  } = props;

  const dispatch = useDispatch();
  const { properties, hierarchy } = useSelector(getCellSets());
  const [isFormValid, setIsFormValid] = useState(false);
  const [numSamples, setNumSamples] = useState(1);
  const [sampleKeys, setSampleKeys] = useState([])
  const comparisonGroup = useSelector((state) => state.differentialExpression.comparison.group);
  const selectedComparison = useSelector((state) => state.differentialExpression.comparison.type);
  const { basis, cellSet, compareWith } = comparisonGroup?.[selectedComparison] || {};

  /**
   * Loads cell set on initial render if it does not already exist in the store.
   */
  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (hierarchy && hierarchy.length === 0) return;

    // If any selected option is deleted, set the option to null
    Object.keys(comparisonGroup).forEach((type) => {
      const deleteKeys = {};

      Object.entries(comparisonGroup[type]).forEach(([comparisonKey, selectedCell]) => {
        selectedCell = getCellSetKey(selectedCell)
        if (selectedCell && !properties.hasOwnProperty(selectedCell)) deleteKeys[comparisonKey] = null
      });

      if (Object.keys(deleteKeys).length) {

        dispatch(
          setComparisonGroup({
            type,
            ...comparisonGroup[type],
            ...deleteKeys,
          }),
        );
      }

    });

    // Calculate the number of sampleIds.
    // if there is only 1 sample, set sample using sample name
    const samples = hierarchy?.find(
      (rootNode) => (rootNode.key === 'sample'),
    )?.children;

    setNumSamples(samples.length)

    if (samples.length === 1) {
      comparisonGroup[selectedComparison]['basis'] = `sample/${samples[0].key}`
    }

    setSampleKeys(samples.map(sample => sample.key));

  }, [hierarchy, properties]);

  const cellIdToSampleMap = useMemo(() => {
    const mapping = [];
    sampleKeys.forEach((key, idx) => {
      const cellIds = properties[key].cellIds;
      cellIds.forEach(cellId => mapping[cellId] = idx);
    });

    return mapping;
  }, [numSamples]);

  // Returns true if each of the compared groups is made up of at least
  // 1 sample with more cells than a given minimum threshold.
  const canRunDiffExpr = useCallback(() => {

    if (selectedComparison === ComparisonType.WITHIN) return canRunDiffExprResults.TRUE;

    if (!basis || !cellSet || !compareWith || !cellIdToSampleMap.length > 0) { return canRunDiffExprResults.FALSE; }

    const basisCellSetKey = getCellSetKey(basis);

    const cellSetKey = getCellSetKey(cellSet);
    const compareWithKey = getCellSetKey(compareWith);

    let basisCellIds = [];
    if (basisCellSetKey === 'all') {
      const allCellIds = sampleKeys.reduce((cumulativeCellIds, key) => {
        const cellIds = properties[key].cellIds;
        return cumulativeCellIds.concat(Array.from(cellIds));
      }, []);
      basisCellIds = new Set(allCellIds);
    } else {
      basisCellIds = properties[basisCellSetKey].cellIds;
    }

    const cellSetCellIds = Array.from(properties[cellSetKey].cellIds);

    let compareWithCellIds = [];
    if (['rest', 'background'].includes(compareWithKey)) {
      const parentKey = getRootKey(cellSet);

      const otherGroupKeys = hierarchy.find(obj => obj.key === parentKey)
        .children.filter(child => child.key !== cellSetKey);

      compareWithCellIds = otherGroupKeys.reduce((acc, child) => {
        return acc.concat(Array.from(properties[child.key].cellIds));
      }, []);
    } else {
      compareWithCellIds = Array.from(properties[compareWithKey].cellIds);
    }

    // Intersect the basis cell set with each group cell set
    const filteredCellSetCellIds = cellSetCellIds.filter(cellId => basisCellIds.has(cellId));
    const filteredCompareWithCellIds = compareWithCellIds.filter(cellId => basisCellIds.has(cellId));

    const numSampleWithEnoughCells = (cellSet) => {
      // Prepare an array of length sampleIds to hold the number of cells for each sample
      const numCellsPerSampleInCellSet = new Array(numSamples).fill(0);

      // Count the number of cells in each sample and assign them into numCellsPerSampleInCellSet
      cellSet
        .forEach(cellId => {
          const sampleIdx = cellIdToSampleMap[cellId];
          numCellsPerSampleInCellSet[sampleIdx] += 1;
        });

      return numCellsPerSampleInCellSet.filter(numCells => numCells >= MIN_NUM_CELLS_IN_GROUP).length;
    }

    const numCellSetSampleWithEnoughCells = numSampleWithEnoughCells(filteredCellSetCellIds)
    const numCompareWithSampleWithEnoughCells = numSampleWithEnoughCells(filteredCompareWithCellIds)


    if (numCellSetSampleWithEnoughCells === 0 || numCompareWithSampleWithEnoughCells === 0) return canRunDiffExprResults.ERROR;

    const sumComparedSamples = numCellSetSampleWithEnoughCells + numCompareWithSampleWithEnoughCells;

    if (sumComparedSamples < MIN_NUM_SAMPLES_SHOW_WARNING) return canRunDiffExprResults.WARNING;
    if (sumComparedSamples < MIN_NUM_SAMPLES_SHOW_ERROR) return canRunDiffExprResults.ERROR;

    return canRunDiffExprResults.TRUE;

  }, [basis, cellSet, compareWith, numSamples]);

  const validateForm = () => {
    if (!cellSet || !compareWith || !basis) {
      setIsFormValid(false);
      return;
    }

    if (
      selectedComparison === ComparisonType.BETWEEN
      && compareWith !== 'background'
      && getRootKey(cellSet) !== getRootKey(compareWith)
    ) {
      setIsFormValid(false);
      return;
    }

    setIsFormValid(true);
  };

  // Validate form when the groups selected changes.
  useEffect(() => {
    validateForm();
  }, [comparisonGroup[selectedComparison]]);

  /**
   * Updates the selected clusters.
   * @param {string} cellSet The key of the cell set.
   * @param {string} option The option string (`cellSet` or `compareWith`).
   */
  const onSelectCluster = (cellSet, option) => {
    dispatch(setComparisonGroup({
      ...comparisonGroup[selectedComparison],
      type: selectedComparison,
      [option]:
        cellSet,
    }));
  };

  /**
   * Constructs a form item, a `Select` field with selectable clusters.
   */
  const renderClusterSelectorItem = ({
    title, option, filterType,
  }) => {
    // Depending on the cell set type specified, set the default name
    const placeholder = filterType === 'metadataCategorical' ? 'sample/group' : 'cell set';

    const tree = composeTree(hierarchy, properties, filterType);

    const renderChildren = (rootKey, children) => {
      if (!children || children.length === 0) { return (<></>); }

      // If this is the `compareWith` option, we need to add `the rest` under the group previously selected.
      if (option === 'compareWith' && comparisonGroup[selectedComparison]?.cellSet?.startsWith(`${rootKey}/`)) {
        children.unshift({ key: `rest`, name: `Rest of ${properties[rootKey].name}` });
      }

      const shouldDisable = (rootKey, key) => {
        // Should always disable something already selected.
        const isAlreadySelected = Object.values(comparisonGroup[selectedComparison]).includes(`${rootKey}/${key}`);

        // or a cell set that is not in the same group as selected previously in `cellSet`
        const parentGroup = getRootKey(comparisonGroup[selectedComparison]?.cellSet);
        const isNotInTheSameGroup = rootKey !== parentGroup;

        return isAlreadySelected || (option === 'compareWith' && isNotInTheSameGroup);
      }

      if (comparisonGroup[selectedComparison]) {
        return children.map(({ key, name }) => {
          const uniqueKey = `${rootKey}/${key}`;

          return <Option key={uniqueKey} disabled={shouldDisable(rootKey, key)}>
            {name}
          </Option>
        });
      }
    };

    return (
      <Form.Item label={title}>
        <Select
          placeholder={`Select a ${placeholder}...`}
          style={{ width: 200 }}
          onChange={(cellSet) => onSelectCluster(cellSet, option)}
          value={comparisonGroup[selectedComparison][option] ?? null}
          size='small'
          aria-label={title}
        >
          {
            option === 'basis' &&
            <Option key='all'>
              All
            </Option>
          }
          {
            option === 'compareWith' &&
            <Option key='background'>
              All other cells
            </Option>
          }
          {
            tree && tree.map(({ key, children }) => (
              <OptGroup label={properties[key]?.name} key={key}>
                {renderChildren(key, [...children])}
              </OptGroup>
            ))
          }
        </Select>
      </Form.Item >
    );
  };

  return (
    <Form size='small' layout='vertical'>
      <Radio.Group
        onChange={(e) => {
          dispatch(setComparisonType(e.target.value));
        }} defaultValue={selectedComparison}>
        <Radio
          value={ComparisonType.WITHIN}>
          Compare cell sets within a sample/group
        </Radio>
        <Radio
          value={ComparisonType.BETWEEN}
          disabled={numSamples === 1}
        >
          Compare a selected cell set between samples/groups
        </Radio>
      </Radio.Group>

      {selectedComparison === ComparisonType.WITHIN
        ? (
          <>
            {renderClusterSelectorItem({
              title: 'Compare cell set:',
              option: 'cellSet',
              filterType: 'cellSets',
            })}

            {renderClusterSelectorItem({
              title: 'and cell set:',
              option: 'compareWith',
              filterType: 'cellSets',
            })}

            {renderClusterSelectorItem({
              title: 'within sample/group:',
              option: 'basis',
              filterType: 'metadataCategorical',
            })}
          </>
        ) : (
          <>
            {renderClusterSelectorItem({
              title: 'Compare cell set:',
              option: 'basis',
              filterType: 'cellSets',
            })}

            {renderClusterSelectorItem({
              title: 'between sample/group:',
              option: 'cellSet',
              filterType: 'metadataCategorical',
            })}

            {renderClusterSelectorItem({
              title: 'and sample/group:',
              option: 'compareWith',
              filterType: 'metadataCategorical',
            })}
          </>
        )}
      <Space direction='vertical'>
        {
          isFormValid && canRunDiffExpr() === canRunDiffExprResults.ERROR ?
            <Alert
              message="Error"
              description={
                <>
                  One or more of the selected samples/groups does not contain enough cells in the selected cell set.
                  Therefore, the analysis can not be run. Select other cell set(s) or samples/groups to compare.
                </>
              }
              type="error"
              showIcon
            /> :
            isFormValid && canRunDiffExpr() === canRunDiffExprResults.WARNING ?
              <Alert
                message="Warning"
                description={
                  <>
                    In the selected samples/groups, less than 3 samples contain enough cells to be compared.
                    The differential expression analysis can be computed, but the adjusted p-value can not be calculated.
                  </>
                }
                type="warning"
                showIcon
              />
              :
              <></>
        }
        <Space direction='horizontal'>
          <Button
            size='small'
            disabled={!isFormValid ||
              [
                canRunDiffExprResults.FALSE,
                canRunDiffExprResults.ERROR
              ].includes(canRunDiffExpr())
            }
            onClick={() => onCompute()}
          >
            Compute
          </Button>
          <Tooltip overlay={(
            <span>
              Differential expression is calculated using the presto implementation of the Wilcoxon rank sum test and auROC analysis. For more information see the
              {' '}
              <a
                href='http://htmlpreview.github.io/?https://github.com/immunogenomics/presto/blob/master/docs/getting-started.html'
                target='_blank'
                rel='noreferrer'
              >
                presto vignette
              </a>.
            </span>
          )}
          >
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      </Space>
    </Form>
  );
};

DiffExprCompute.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onCompute: PropTypes.func.isRequired,
};

export default DiffExprCompute;
