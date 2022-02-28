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
import { getCellSets, getCellSetsHierarchyByKeys } from 'redux/selectors';
import { composeTree } from 'utils/cellSets';

const { Option, OptGroup } = Select;

const ComparisonType = Object.freeze({ between: 'between', within: 'within' });
const getCellSetName = (name) => (name?.split('/')[1] || name)

const DiffExprCompute = (props) => {
  const {
    experimentId, onCompute,
  } = props;

  const dispatch = useDispatch();
  const { properties, hierarchy } = useSelector(getCellSets());
  const [isFormValid, setIsFormValid] = useState(false);
  const [numSamples, setNumSamples] = useState(1);
  const comparisonGroup = useSelector((state) => state.differentialExpression.comparison.group);
  const selectedComparison = useSelector((state) => state.differentialExpression.comparison.type);
  const { basis, cellSet, compareWith } = comparisonGroup?.[selectedComparison] || {};
  const sampleKeys = useSelector(getCellSetsHierarchyByKeys(['sample']))[0].children.map(obj => obj.key)

  // Metadata marks whether cells belong to the same sample/group
  // Therefore `between samples/groups` analysis makes no sense if there is no metadata.
  // In the base state, assume there is no metadata. A check for this is done in a useEffect block below.
  const [hasMetadata, setHasMetadata] = useState(false);

  const cellIdToSampleMap = useMemo(() => {
    const mapping = [];
    sampleKeys.forEach((key, idx) => {
      const cellIds = properties[key].cellIds;
      cellIds.forEach(cellId => mapping[cellId] = idx);
    });

    return mapping;
  }, [numSamples]);

  const canRunDifferentialExpression = useCallback(() => {
    if (!basis || !cellSet || !compareWith || !cellIdToSampleMap.length > 0) { return false; }

    const basisCellSetKey = basis.split("/")[1];
    const group1CellSetKey = cellSet.split("/")[1];
    const group2CellSetKey = compareWith.split("/")[1];

    // Handle rest and all
    const basisCellSet = properties[basisCellSetKey].cellIds;
    const group1CellSet = properties[group1CellSetKey].cellIds;
    const group2CellSet = properties[group2CellSetKey].cellIds;

    const group1CellIds = [...group1CellSet].filter(cellId => basisCellSet.has(cellId));
    const group2CellIds = [...group2CellSet].filter(cellId => basisCellSet.has(cellId));

    const group1Samples = new Array(numSamples).fill(0);
    const group2Samples = new Array(numSamples).fill(0);

    group1CellIds
      .forEach(cellId => {
        const sampleIdx = cellIdToSampleMap[cellId];
        group1Samples[sampleIdx] += 1;
      });

    group2CellIds
      .forEach(cellId => {
        const sampleIdx = cellIdToSampleMap[cellId];
        group2Samples[sampleIdx] += 1;
      });

    const group1Passes = group1Samples.find(numCells => numCells > 10);
    const group2Passes = group2Samples.find(numCells => numCells > 10);

    return group1Passes && group2Passes;
  }, [basis, cellSet, compareWith, numSamples]);

  /**
   * Loads cell set on initial render if it does not already exist in the store.
   */
  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (hierarchy && hierarchy.length === 0) return;

    // Make sure we are not rendering metadata-related options if there is no metadata in the data set.
    const numMetadata = Object.values(properties).filter((o) => o.type === 'metadataCategorical').length;

    if (!numMetadata) {
      dispatch(setComparisonType(ComparisonType.within));
    }
    setHasMetadata(numMetadata > 0);


    // If any selected option is deleted, set the option to null
    Object.keys(comparisonGroup).forEach((type) => {
      const deleteKeys = {};

      Object.entries(comparisonGroup[type]).forEach(([comparisonKey, selectedCell]) => {
        selectedCell = getCellSetName(selectedCell)
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

  }, [hierarchy, properties]);

  const validateForm = () => {

    if (!cellSet) {
      setIsFormValid(false);
      return;
    }

    if (!compareWith) {
      setIsFormValid(false);
      return;
    }

    if (!basis) {
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
    // Dependiung on the cell set type specified, set the default name
    const placeholder = filterType === 'metadataCategorical' ? 'sample/group' : 'cell set';

    const tree = composeTree(hierarchy, properties, filterType);

    const renderChildren = (rootKey, children) => {
      if (!children || children.length === 0) { return (<></>); }

      // If this is the `compareWith` option, we need to add `the rest` under the group previously selected.
      if (option === 'compareWith' && comparisonGroup[selectedComparison]?.cellSet?.startsWith(`${rootKey}/`)) {
        children.unshift({ key: `rest`, name: `Rest of ${properties[rootKey].name}` });
      }

      const shouldDisable = (key) => {
        // Should always disable something already selected.
        return Object.values(comparisonGroup[selectedComparison]).includes(key);
      }

      if (comparisonGroup[selectedComparison]) {
        return children.map(({ key, name }) => {
          const uniqueKey = `${rootKey}/${key}`;

          return <Option key={uniqueKey} disabled={shouldDisable(uniqueKey)}>
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

  const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
  };

  return (
    <Form size='small' layout='vertical'>

      <Radio.Group onChange={(e) => {
        dispatch(setComparisonType(e.target.value));
      }} defaultValue={selectedComparison}>
        <Radio
          style={radioStyle}
          value={ComparisonType.within}>
          Compare cell sets within a sample/group
        </Radio>
        <Radio
          style={radioStyle}
          value={ComparisonType.between}
          disabled={!hasMetadata || numSamples === 1}
        >
          Compare a selected cell set between samples/groups
        </Radio>
      </Radio.Group>

      {selectedComparison === ComparisonType.between
        ? (
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
        )
        : (
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
        )}

      <Form.Item>
        <Space direction='vertical'>
          {
            !canRunDifferentialExpression() ?
              <Alert
                message="Error"
                description="One or more of the selected samples/groups does not contain enough cells in the selected cell set. Therefore, the analysis can not be run. Select other cell set(s) or samples/groups to compare."
                type="error"
                showIcon
              /> : <></>
          }
          <Space direction='horizontal'>
            <Button
              size='small'
              disabled={!isFormValid}
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
      </Form.Item>
    </Form>
  );
};

DiffExprCompute.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onCompute: PropTypes.func.isRequired,
};

export default DiffExprCompute;
