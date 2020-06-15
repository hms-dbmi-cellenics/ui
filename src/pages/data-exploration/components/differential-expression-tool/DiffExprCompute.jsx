import React, { useState, useEffect } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';

import {
  Button, Radio, Form, Select, Typography, Space,
} from 'antd';

import PropTypes from 'prop-types';
import { cloneDeep } from 'lodash';
import { loadCellSets } from '../../../../redux/actions';

const { Text } = Typography;

const { Option } = Select;

const ComparisonTypes = {
  One: 'Versus Rest',
  Two: 'Across Sets',
};

const DiffExprCompute = (props) => {
  const {
    experimentID, onCompute, first, second, comparison,
  } = props;
  const cellSetsData = useSelector((state) => state.cellSets.data);
  const [selectableClusters, setSelectableClusters] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadCellSets(experimentID));
  }, []);

  const resetSelectableClusters = () => {
    if (!cellSetsData) {
      setSelectableClusters([]);
    } else {
      const options = [];
      cellSetsData.forEach((cellSet) => {
        if (cellSet.children) {
          cellSet.children.forEach((c) => {
            options.push({
              key: c.key,
              value: c.name.concat(' (', cellSet.name, ')'),
            });
          });
        }
      });
      setSelectableClusters(options);
    }
  };

  const defaultSelected = { key: 'default', value: 'select cluster' };
  const [comparisonType, setComparisonType] = useState(comparison);
  const [computeDisabled, setComputeDisabled] = useState(true);
  const [availableClusters, setAvailableClusters] = useState(selectableClusters);
  const [firstSelectedCluster, setFirstSelectedCluster] = useState(first || defaultSelected);
  const [secondSelectedCluster, setSecondSelectedCluster] = useState(second || defaultSelected);

  const updateComputeButtonStatus = () => {
    if (firstSelectedCluster.key === defaultSelected.key) {
      setComputeDisabled(true);
      return;
    }
    if (comparisonType === ComparisonTypes.One) {
      setComputeDisabled(false);
      return;
    }
    if (secondSelectedCluster.key !== defaultSelected.key && ComparisonTypes.Two) {
      setComputeDisabled(false);
    } else {
      setComputeDisabled(true);
    }
  };

  const findCluster = (key) => {
    for (let i = 0; i < selectableClusters.length; i += 1) {
      if (selectableClusters[i].key === key) {
        return i;
      }
    }
  };

  const resetAvailableClusters = () => {
    const newSelectableClusters = cloneDeep(selectableClusters);
    if (firstSelectedCluster.key !== defaultSelected.key) {
      const indexFirst = findCluster(firstSelectedCluster.key);
      newSelectableClusters.splice(indexFirst, 1);
    }
    if (secondSelectedCluster.key !== defaultSelected.key) {
      const indexSecond = findCluster(secondSelectedCluster.key);
      newSelectableClusters.splice(indexSecond, 1);
    }
    setAvailableClusters(newSelectableClusters);
  };

  useEffect(() => {
    resetSelectableClusters();
  }, [cellSetsData]);

  useEffect(() => {
    updateComputeButtonStatus();
  }, [comparisonType, firstSelectedCluster, secondSelectedCluster]);

  useEffect(() => {
    resetAvailableClusters();
  }, [firstSelectedCluster, secondSelectedCluster, selectableClusters]);

  const onSelectComparisonType = (e) => {
    setComparisonType(e.target.value);
    if (e.target.value === ComparisonTypes.One) {
      setSecondSelectedCluster(defaultSelected);
    }
  };

  const onSelectCluster = (selectedValue, selectedPanel) => {
    const selectedCluster = selectableClusters.find((obj) => obj.value === selectedValue);
    if (selectedPanel === 1) {
      setFirstSelectedCluster(selectedCluster);
    }
    if (selectedPanel === 2) {
      setSecondSelectedCluster(selectedCluster);
    }
  };

  const renderClusterSelect = () => {
    if (comparisonType === ComparisonTypes.One) {
      return (
        <Form.Item>
          <Space>
            <div>Cell Set</div>
            <Select
              style={{ width: 200 }}
              onChange={(option) => onSelectCluster(option, 1)}
              optionLabelProp='value'
              value={firstSelectedCluster.value}
              size='small'
            >
              {
                availableClusters.map((name) => (
                  <Option value={name.value} key={name.key} />
                ))
              }
            </Select>
          </Space>
        </Form.Item>
      );
    }
    if (comparisonType === ComparisonTypes.Two) {
      return (
        <Form.Item>
          <Space>
            <div>Cell Sets</div>
            <Select
              style={{ width: 200 }}
              onChange={(option) => onSelectCluster(option, 1)}
              optionLabelProp='value'
              value={firstSelectedCluster.value}
              size='small'
            >
              {
                availableClusters.map((name) => (
                  <Option value={name.value} key={name.key} />
                ))
              }
            </Select>
            <Select
              style={{ width: 200 }}
              onChange={(option) => onSelectCluster(option, 2)}
              optionLabelProp='value'
              value={secondSelectedCluster.value}
              size='small'
            >
              {
                availableClusters.map((name) => (
                  <Option value={name.value} key={name.key} />
                ))
              }
            </Select>
          </Space>
        </Form.Item>
      );
    }
    return (<></>);
  };

  return (
    <Form size='small'>
      <div>Compare</div>
      <Form.Item>
        <Radio.Group onChange={onSelectComparisonType} value={comparisonType}>
          <Radio value={ComparisonTypes.One}>
            {ComparisonTypes.One}
          </Radio>
          <Radio value={ComparisonTypes.Two}>
            {ComparisonTypes.Two}
          </Radio>
        </Radio.Group>
      </Form.Item>
      {renderClusterSelect()}
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
          disabled={computeDisabled}
          onClick={() => onCompute(
            comparisonType,
            firstSelectedCluster,
            secondSelectedCluster,
          )}
        >
          Compute
        </Button>
      </Form.Item>
    </Form>
  );
};

DiffExprCompute.defaultProps = {
  first: null,
  second: null,
  comparison: null,
};

DiffExprCompute.propTypes = {
  experimentID: PropTypes.string.isRequired,
  onCompute: PropTypes.func.isRequired,
  first: PropTypes.string,
  second: PropTypes.string,
  comparison: PropTypes.string,
};

export default DiffExprCompute;
