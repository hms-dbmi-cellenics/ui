import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getCellSets } from 'redux/selectors';

import {
  Select, Space,
} from 'antd';

const TrajectoryAnalysisDisplaySettings = (props) => {
  const { setSelectedCellSets, selectedCellSets } = props;

  const { properties } = useSelector(getCellSets());

  const options = useMemo(() => Object.entries(properties).map(([key, cellSetObject]) => {
    const { name, rootNode } = cellSetObject;

    return {
      label: rootNode ? `All ${name}` : `${name}`,
      value: key,
    };
  }), []);

  return (
    <Space direction='vertical'>
      <p>Select cell sets to use for trajectory analysis</p>
      <Select
        mode='multiple'
        allowClear
        style={{ width: '100%' }}
        placeholder='Please select'
        value={options.filter(({ value }) => selectedCellSets.includes(value))}
        onChange={(values) => {
          const selectedCellSetKeys = values.map(({ value }) => value);
          setSelectedCellSets(selectedCellSetKeys);
        }}
        options={options}
        labelInValue
        filterOption={
          (searchText, { name }) => name.toLowerCase().startsWith(searchText.toLowerCase())
        }
      />
      <br />
    </Space>
  );
};

TrajectoryAnalysisDisplaySettings.propTypes = {
  setSelectedCellSets: PropTypes.func.isRequired,
  selectedCellSets: PropTypes.object.isRequired,
};

export default TrajectoryAnalysisDisplaySettings;
