import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Select,
  Tooltip,
} from 'antd';

import { getCellSetsHierarchyByType } from 'redux/selectors';
import { useSelector } from 'react-redux';

const getSelectOptions = (options) => {
  const selectOptions = [];
  if (!options.length) {
    return;
  }

  Array.from(options).forEach((option) => {
    selectOptions.push({
      value: option.key,
      label: option.name,
    });
  });
  return selectOptions;
};

const SelectCellSets = (props) => {
  const {
    onUpdate, config,
  } = props;

  const optionsMetadata = useSelector(getCellSetsHierarchyByType('metadataCategorical'));
  const optionsCellSets = useSelector(getCellSetsHierarchyByType('cellSets'));

  let disabled = false;
  let toolTipText;

  const changeXAxisGrouping = (option) => {
    onUpdate({ xAxisGrouping: option.value });
  };

  const changeProportionGrouping = (option) => {
    onUpdate({ proportionGrouping: option.value });
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
      </div>
      <Form.Item>
        <Tooltip title={toolTipText}>
          <Select
            aria-label='metadata'
            value={{
              value: menuValue,
            }}
            onChange={changeXAxisGrouping}
            labelInValue
            disabled={disabled}
            style={{ width: '100%' }}
            placeholder='Select cell set...'
            options={metadataMenu}
          />
        </Tooltip>
      </Form.Item>
      <div>
        Select how the data should be grouped:
      </div>
      <Form.Item>
        <Select
          aria-label='groupBy'
          value={{
            value: config.proportionGrouping,
          }}
          onChange={changeProportionGrouping}
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
};
export default SelectCellSets;
