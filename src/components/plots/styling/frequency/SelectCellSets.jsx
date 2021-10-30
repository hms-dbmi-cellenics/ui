import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Select,
  Tooltip,
} from 'antd';
import getSelectOptions from 'utils/plots/getSelectOptions';
import _ from 'lodash';

const SelectCellSets = (props) => {
  const {
    onUpdate, config, optionsMetadata, optionsCellSets,
  } = props;

  const changeClusters = (option) => {
    const newValue = option.value.toLowerCase();
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
    menuValue = 'sample';
    disabled = true;
    toolTipText = 'The x-axis cannot be changed as this dataset has only a single sample.';
  } else {
    menuValue = config.xAxisGrouping;
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
            aria-label='metadata'
            value={{
              value: menuValue,
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
          aria-label='cell sets'
          value={{
            value: config.proportionGrouping,
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
