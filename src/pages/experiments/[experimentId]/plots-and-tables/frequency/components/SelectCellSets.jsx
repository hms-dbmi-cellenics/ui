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

  const changeMetadata = (val) => {
    onUpdate({ metadata: val.key });
  };

  const generateCellOptions = (type) => {
    if (cellSets.loading) {
      return [];
    }
    const options = cellSets.hierarchy.map(({ key }) => ({ value: key }));
    const filteredOptions = options.filter((element) => (
      cellSets.properties[element.value].type === type
    ));
    return filteredOptions;
  };

  return (
    <>
      <div>
        Select the metadata that cells are grouped by
        (Determines the x-axis):
        {' '}
      </div>
      <Form.Item>
        <Select
          value={{ key: config.metadata }}
          onChange={(value) => changeMetadata(value)}
          labelInValue
          disabled={!generateCellOptions('metadataCategorical').length}
          style={{ width: '100%' }}
          placeholder='Select cell set...'
          options={generateCellOptions('metadataCategorical')}
        />
      </Form.Item>
      <div>
        Select the cell sets to be shown:
      </div>
      <Form.Item>
        <Select
          value={{ key: config.chosenClusters }}
          onChange={(value) => changeClusters(value)}
          labelInValue
          style={{ width: '100%' }}
          placeholder='Select cell set...'
          options={generateCellOptions('cellSets')}
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
