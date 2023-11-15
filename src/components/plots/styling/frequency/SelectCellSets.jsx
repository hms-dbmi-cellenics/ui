import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Select,
  Tooltip,
} from 'antd';

import { getCellSetsHierarchyByType } from 'redux/selectors';
import { useSelector } from 'react-redux';

const getGroupByOptions = (cellSetsHierarchyType) => {
  const options = useSelector(getCellSetsHierarchyByType(cellSetsHierarchyType))
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

  const changeXAxisGrouping = (option) => {
    onUpdate({
      xAxisGrouping: option.value,
      axes: { ...config.axes, xAxisText: option.label },
    });
  };

  const changeProportionGrouping = (option) => {
    onUpdate({ proportionGrouping: option.value });
  };

  const metadataGroupByOptions = getGroupByOptions('metadataCategorical');
  const cellSetsGroupByOptions = getGroupByOptions('cellSets');

  let metadataToGroupByDisabled = false;
  let tooltipText;
  if (!metadataGroupByOptions || metadataGroupByOptions.length === 1) {
    metadataToGroupByDisabled = true;
    tooltipText = 'The x-axis cannot be changed as this dataset has only a single sample.';
  }

  return (
    <>
      <div>
        Select the metadata that cells are grouped by
        (Determines the x-axis):
      </div>
      <Form.Item>
        <Tooltip title={tooltipText}>
          <Select
            aria-label='metadata'
            value={{
              value: config.xAxisGrouping,
            }}
            onChange={changeXAxisGrouping}
            labelInValue
            disabled={metadataToGroupByDisabled}
            options={metadataGroupByOptions}
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
          options={cellSetsGroupByOptions}
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
