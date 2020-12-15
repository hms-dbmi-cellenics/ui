import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Select,
} from 'antd';

const SelectCellSets = (props) => {
  const { onUpdate, config, cellSets } = props;

  const changeClusters = (val) => {
    onUpdate({ chosenClusters: val.key });
  };
  const generateCellOptions = () => {
    if (cellSets.loading) {
      return [];
    }
    const options = cellSets.hierarchy.map(({ key }) => ({ value: key }));
    return options.filter((element) => (
      cellSets.properties[element.value].type === 'cellSets'
    ));
  };
  return (
    <>
      <Form.Item>
        <Select
          value={{ key: config.chosenClusters }}
          onChange={(value) => changeClusters(value)}
          labelInValue
          style={{ width: '100%' }}
          placeholder='Select cell set...'
          options={generateCellOptions()}
        />

      </Form.Item>
    </>
  );
};
SelectCellSets.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  cellSets: PropTypes.object.isRequired,
};
export default SelectCellSets;
