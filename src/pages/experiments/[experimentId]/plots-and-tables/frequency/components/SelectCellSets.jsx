import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Select,
  Tooltip,
} from 'antd';

const SelectCellSets = (props) => {
  const { onUpdate, config, cellSets } = props;
  const changeClusters = (val) => {
    const newValue = val.key.charAt(0).toLowerCase() + val.key.slice(1);
    onUpdate({ chosenClusters: newValue });
  };
  let menuValue = config.metadata;
  let disabled = false;
  let toolTipText;
  const changeMetadata = (val) => {
    const newValue = val.key.charAt(0).toLowerCase() + val.key.slice(1);
    onUpdate({ metadata: newValue });
  };

  const generateCellOptions = (type) => {
    if (cellSets.loading) {
      return [];
    }
    const options = cellSets.hierarchy.map(({ key }) => ({ value: key }));
    const filteredOptions = options.filter((element) => (
      cellSets.properties[element.value].type === type
    ));
    if (!filteredOptions.length) {
      return [];
    }
    // making the options with capital letters as per requirement
    const upperCaseOptions = [];
    filteredOptions.forEach((option) => {
      upperCaseOptions.push({
        value: option.value.charAt(0).toUpperCase() + option.value.slice(1),
      });
    });
    return upperCaseOptions;
  };
  if (!generateCellOptions('metadataCategorical').length) {
    menuValue = 'Sample';
    disabled = true;
    toolTipText = 'The x-axis cannot be changed as this dataset has only a single sample.';
  }
  return (
    <>
      <div>
        Select the metadata that cells are grouped by
        (Determines the x-axis):
        {' '}
      </div>
      <Form.Item>
        <Tooltip title={toolTipText}>
          <Select
            value={{
              key: menuValue.charAt(0).toUpperCase()
                + menuValue.slice(1),
            }}
            onChange={(value) => changeMetadata(value)}
            labelInValue
            disabled={disabled}
            style={{ width: '100%' }}
            placeholder='Select cell set...'
            options={generateCellOptions('metadataCategorical')}
          />
        </Tooltip>
      </Form.Item>
      <div>
        Select the cell sets to be shown:
      </div>
      <Form.Item>
        <Select
          value={{
            key: config.chosenClusters.charAt(0).toUpperCase()
              + config.chosenClusters.slice(1),
          }}
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
