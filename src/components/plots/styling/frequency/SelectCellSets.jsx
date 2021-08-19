/* eslint-disable import/no-unresolved */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Select,
  Tooltip,
} from 'antd';
import getSelectOptions from 'utils/plots/getSelectOptions';

const SelectCellSets = (props) => {
  const {
    onUpdate, config, optionsMetadata, optionsCellSets,
  } = props;

  const firstLetterUppercase = (word) => word?.charAt(0).toUpperCase() + word?.slice(1);
  const changeClusters = (val) => {
    const newValue = val.key.toLowerCase();
    onUpdate({ proportionGrouping: newValue });
  };
  let disabled = false;
  let toolTipText;
  const changeMetadata = (val) => {
    const newValue = val.key.toLowerCase();
    onUpdate({ xAxisGrouping: newValue });
  };

  const metadataMenu = getSelectOptions(optionsMetadata);
  const cellSetMenu = getSelectOptions(optionsCellSets);
  let menuValue;
  if (!metadataMenu) {
    menuValue = 'Sample';
    disabled = true;
    toolTipText = 'The x-axis cannot be changed as this dataset has only a single sample.';
  } else {
    menuValue = firstLetterUppercase(config.xAxisGrouping);
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
            key: firstLetterUppercase(config.proportionGrouping),
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
