import React, { useState, useEffect } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';

import {
  Button, Form, Select, Typography, Tooltip,
} from 'antd';

import PropTypes from 'prop-types';
import _ from 'lodash';
import { loadCellSets } from '../../../../redux/actions/cellSets';


const { Text } = Typography;

const { Option, OptGroup } = Select;

const DiffExprCompute = (props) => {
  const {
    experimentId, onCompute, cellSets,
  } = props;

  const dispatch = useDispatch();

  const properties = useSelector((state) => state.cellSets.properties);
  const hierarchy = useSelector((state) => state.cellSets.hierarchy);
  const [selectableClusters, setSelectableClusters] = useState(_.cloneDeep(hierarchy));
  const [isFormValid, setIsFormValid] = useState(false);
  const defaultSelected = 'Select a cell set';
  const [selectedCellSets, setSelectedCellSets] = useState(cellSets);

  /**
   * Loads cell set on initial render if it does not already exist in the store.
   */
  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);


  console.log(cellSets, selectedCellSets);

  const generateSpecialKey = (parentKey) => ({ key: ['all', parentKey].join('-') });
  const isKeySpecial = (key) => (key === 'rest' || key === 'All' || key.startsWith('all-'));

  /**
   * Re-renders the list of selections when the hierarchy or the properties change.
   *
   * If the cell set previously selected is deleted, the selection is reset to the default.
   */
  useEffect(() => {
    if (hierarchy.length === 0) return;

    const newSelectableClusters = _.cloneDeep(hierarchy);
    // create a new item for each hierarchy to represent All
    newSelectableClusters.map(({ key, children }) => {
      if (children && children.length > 0) {
        children.push(generateSpecialKey(key));
      }
    });
    setSelectableClusters(newSelectableClusters);

    setSelectedCellSets(_.mapValues(selectedCellSets, (cellSetKey) => {
      if (isKeySpecial(cellSetKey)) {
        return 'All';
      }
      if (cellSetKey !== defaultSelected && !properties[cellSetKey]) {
        return defaultSelected;
      }
      return cellSetKey;
    }));
  }, [hierarchy, properties]);


  const validateForm = () => {
    if (selectedCellSets.cellSet === defaultSelected) {
      setIsFormValid(false);
      return;
    }
    if (selectedCellSets.compareWith === defaultSelected) {
      setIsFormValid(false);
      return;
    }
    if (selectedCellSets.cellSet === selectedCellSets.compareWith) {
      setIsFormValid(false);
      return;
    }
    setIsFormValid(true);
  };

  useEffect(() => {
    validateForm();
  }, [selectedCellSets]);

  /**
   * Updates the selected clusters.
   * @param {string} cellSet The key of the cell set.
   * @param {string} option The option string (`cellSet` or `compareWith`).
   */
  const onSelectCluster = (cellSet, option) => {
    setSelectedCellSets({
      ...selectedCellSets,
      [option]: cellSet,
    });
  };

  /**
   * Constructs a form item, a `Select` field with selectable clusters.
   */
  const renderClusterSelectorItem = (title, option) => {
    const renderChildren = (children) => {
      if (!children || children.length === 0) { return (<></>); }
      return children.map(({ key }) => {
        if (isKeySpecial(key) && title === 'Compare') {
          return <></>;
        }
        return (
          <Option key={key} disabled={Object.values(selectedCellSets).includes(key)}>
            {isKeySpecial(key) ? (
              <Tooltip placement='left' title='Compare above selected set and its complements'>
                <span style={{ display: 'flex', flexGrow: 1 }}>All</span>
              </Tooltip>
            ) : properties[key]?.name}
          </Option>
        );
      });
    };

    return (
      <Form.Item label={title}>
        <Select
          style={{ width: 200 }}
          onChange={(cellSet) => onSelectCluster(cellSet, option)}
          value={selectedCellSets[option]}
          size='small'
        >
          {
            selectableClusters && selectableClusters.map(({ key, children }) => (
              <OptGroup label={properties[key]?.name} key={key}>
                {renderChildren(children)}
              </OptGroup>
            ))
          }
        </Select>
      </Form.Item>
    );
  };

  return (
    <Form size='small' layout='vertical'>
      {renderClusterSelectorItem('Compare:', 'cellSet')}
      {renderClusterSelectorItem('Versus:', 'compareWith')}

      <p>
        <Text type='secondary'>
          Performs a Wilcoxon rank-sum test between selected sets. Cite
          {' '}
          <a href='https://diffxpy.readthedocs.io/en/latest/api/diffxpy.api.test.pairwise.html'>
            diffxpy.api.test.pairwise
          </a>
          {' '}
          as appropriate.
        </Text>
      </p>

      <Form.Item>
        <Button
          size='small'
          disabled={!isFormValid}
          onClick={() => onCompute(
            {
              cellSet: selectedCellSets.cellSet,
              compareWith: isKeySpecial(selectedCellSets.compareWith) ? 'rest' : selectedCellSets.compareWith,
            },
          )}
        >
          Compute
        </Button>
      </Form.Item>
    </Form>
  );
};

DiffExprCompute.defaultProps = {
};

DiffExprCompute.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onCompute: PropTypes.func.isRequired,
  cellSets: PropTypes.object.isRequired,
};

export default DiffExprCompute;
