import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Select,
  Tooltip,
} from 'antd';

const SelectCellSets = (props) => {
  const { onUpdate, config, cellSets } = props;
  const firstLetterUppercase = (word) => word.charAt(0).toUpperCase() + word.slice(1);

  const changeClusters = (val) => {
    const newValue = val.key.toLowerCase();
    onUpdate({ chosenClusters: newValue });
  };
  let menuValue = config.metadata;
  let disabled = false;
  let toolTipText;
  const changeMetadata = (val) => {
    const newValue = val.key.toLowerCase();
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
        value: firstLetterUppercase(option.value),
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
              key: firstLetterUppercase(menuValue),
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
            key: firstLetterUppercase(config.chosenClusters),
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
