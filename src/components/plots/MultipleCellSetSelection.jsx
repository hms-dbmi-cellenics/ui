import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getCellSets } from 'redux/selectors';

import {
  Select, Space,
} from 'antd';

const MultipleCellSetSelection = (props) => {
  const {
    onChange, selectedCellSets, extraElements, labelText,
  } = props;

  const { hierarchy, properties } = useSelector(getCellSets());

  const options = useMemo(() => {
    const result = [];

    if (!hierarchy.length) return result;

    hierarchy.forEach(({ key: parentKey, children }) => {
      result.push({ label: `All ${properties[parentKey].name}`, value: parentKey });

      const childrenOptions = children.map(({ key }) => ({
        label: properties[key].name,
        value: key,
      }));

      result.push(...childrenOptions);
    });

    return result;
  }, [hierarchy]);

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      { labelText }
      <Select
        mode='multiple'
        allowClear
        style={{ width: '100%' }}
        placeholder='Select cell sets'
        value={options.filter(({ value }) => selectedCellSets.includes(value))}
        onChange={(values) => {
          const selectedCellSetKeys = values.map(({ value }) => value);
          onChange(selectedCellSetKeys);
        }}
        options={options}
        labelInValue
        filterOption={
          (searchText, { label }) => label.toLowerCase().match(searchText.toLowerCase())
        }
      />
      { extraElements }
    </Space>
  );
};

MultipleCellSetSelection.propTypes = {
  onChange: PropTypes.func.isRequired,
  selectedCellSets: PropTypes.array,
  labelText: PropTypes.string,
  extraElements: PropTypes.node,
};

MultipleCellSetSelection.defaultProps = {
  selectedCellSets: [],
  labelText: 'Select cell sets',
  extraElements: null,
};

export default MultipleCellSetSelection;
