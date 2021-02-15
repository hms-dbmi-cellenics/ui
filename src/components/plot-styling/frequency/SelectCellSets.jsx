import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Select,
  Tooltip,
} from 'antd';

const SelectCellSets = (props) => {
  const {
    onUpdate, config, optionsMetadata, optionsCellSets,
  } = props;
  const firstLetterUppercase = (word) => word.charAt(0).toUpperCase() + word.slice(1);
  const changeClusters = (val) => {
    const newValue = val.key.toLowerCase();
    onUpdate({ chosenClusters: newValue });
  };
  let disabled = false;
  let toolTipText;
  const changeMetadata = (val) => {
    const newValue = val.key.toLowerCase();
    onUpdate({ metadata: newValue });
  };

  const getSelectOptions = (options) => {
    const selectOptions = [];
    if (!options.length) {
      return;
    }
    Array.from(options).forEach((option) => {
      selectOptions.push({
        value: firstLetterUppercase(option.key),
      });
    });
    return selectOptions;
  };
  const metadataMenu = getSelectOptions(optionsMetadata);
  const cellSetMenu = getSelectOptions(optionsCellSets);
  let menuValue;
  if (!metadataMenu) {
    menuValue = 'Sample';
    disabled = true;
    toolTipText = 'The x-axis cannot be changed as this dataset has only a single sample.';
  } else {
    menuValue = firstLetterUppercase(config.metadata);
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
              key: menuValue,
            }}
            onChange={changeMetadata}
            labelInValue
            disabled={disabled}
            style={{ width: '100%' }}
            placeholder='Select cell set...'
            options={metadataMenu}
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
          onChange={changeClusters}
          labelInValue
          style={{ width: '100%' }}
          placeholder='Select cell set...'
          options={cellSetMenu}
        />
      </Form.Item>
    </>
  );
};
SelectCellSets.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  optionsMetadata: PropTypes.array.isRequired,
  optionsCellSets: PropTypes.array.isRequired,
};
export default SelectCellSets;
