import React, { useState, useEffect } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';

import {
  Button, Radio, Form, Select, Typography,
} from 'antd';

import PropTypes from 'prop-types';
import _ from 'lodash';
import { loadCellSets } from '../../../../redux/actions/cellSets';


const { Text } = Typography;

const { Option, OptGroup } = Select;

const ComparisonTypes = {
  One: 'Versus rest',
  Two: 'Across sets',
};

const DiffExprCompute = (props) => {
  const {
    experimentId, onCompute, selection, comparison,
  } = props;

  const dispatch = useDispatch();

  const properties = useSelector((state) => state.cellSets.properties);
  const hierarchy = useSelector((state) => state.cellSets.hierarchy);
  const [selectableClusters, setSelectableClusters] = useState(_.cloneDeep(hierarchy));

  const [isFormValid, setIsFormValid] = useState(false);
  const [comparisonType, setComparisonType] = useState(comparison);

  const defaultSelected = 'Select a cell set';
  const [selectedCellSets, setSelectedCellSets] = useState(selection);

  /**
   * Loads cell set on initial render if it does not already exist in the store.
   */
  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  /**
   * Re-renders the list of selections when the hierarchy or the properties change.
   *
   * If the cell set previously selected is deleted, the selection is reset to the default.
   */
  useEffect(() => {
    setSelectableClusters(hierarchy);

    setSelectedCellSets(_.mapValues(selectedCellSets, (cellSetKey) => {
      if (cellSetKey !== defaultSelected && !properties[cellSetKey]) {
        return defaultSelected;
      }

      return cellSetKey;
    }));
  }, [hierarchy, properties]);


  const validateForm = () => {
    if (selectedCellSets.first === defaultSelected) {
      setIsFormValid(false);
      return;
    }

    if (selectedCellSets.first === selectedCellSets.second) {
      setIsFormValid(false);
      return;
    }

    if (comparisonType === ComparisonTypes.Two && selectedCellSets.second === defaultSelected) {
      setIsFormValid(false);
      return;
    }

    setIsFormValid(true);
  };

  useEffect(() => {
    validateForm();
  }, [comparisonType, selectedCellSets]);

  const onSelectComparisonType = (e) => {
    setComparisonType(e.target.value);

    if (e.target.value === ComparisonTypes.One) {
      setSelectedCellSets({
        ...selectedCellSets,
        second: defaultSelected,
      });
    }
  };

  /**
   * Updates the selected clusters.
   * @param {string} cellSet The key of the cell set.
   * @param {string} option The option string (`first` or `second`).
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

      return children.map(({ key }) => (
        <Option key={key} disabled={Object.values(selectedCellSets).includes(key)}>
          {properties[key]?.name}
        </Option>
      ));
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
            selectableClusters.map(({ key, children }) => (
              <OptGroup label={properties[key]?.name} key={key}>
                {renderChildren(children)}
              </OptGroup>
            ))
          }
        </Select>
      </Form.Item>
    );
  };

  /**
   * Renders the form for selecting one or two cell sets for simple DE.
   */
  const renderClusterSelectorForm = () => {
    if (comparisonType === ComparisonTypes.One) {
      return (
        renderClusterSelectorItem('Select cell set:', 'first')
      );
    }

    if (comparisonType === ComparisonTypes.Two) {
      return (
        <>
          {renderClusterSelectorItem('Select a base cell set:', 'first')}
          {renderClusterSelectorItem('Select a comparison set:', 'second')}
        </>
      );
    }

    return (<></>);
  };

  return (
    <Form size='small' layout='vertical'>
      <Form.Item label='Compare:'>
        <Radio.Group onChange={onSelectComparisonType} value={comparisonType}>
          <Radio value={ComparisonTypes.One}>
            {ComparisonTypes.One}
          </Radio>
          <Radio value={ComparisonTypes.Two}>
            {ComparisonTypes.Two}
          </Radio>
        </Radio.Group>
      </Form.Item>

      {renderClusterSelectorForm()}

      <p>
        <Text type='secondary'>
          Performs a Wilcoxon rank-sum test
          between two specified cell sets (across sets)
          or a set and its complement (versus rest).
          Cite
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
            comparisonType,
            selectedCellSets,
          )}
        >
          Compute
        </Button>
      </Form.Item>
    </Form>
  );
};

DiffExprCompute.defaultProps = {
  comparison: null,
};

DiffExprCompute.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onCompute: PropTypes.func.isRequired,
  selection: PropTypes.object.isRequired,
  comparison: PropTypes.string,
};

export default DiffExprCompute;
