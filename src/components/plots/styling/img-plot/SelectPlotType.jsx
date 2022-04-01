import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Select,
  Tooltip,
} from 'antd';

// import getSelectOptions from 'utils/plots/getSelectOptions';
// import { useSelector } from 'react-redux';

const SelectPlotType = (props) => {
  const {
    onUpdate, config,
  } = props;

  let disabled = false;
  let toolTipText;

  const changePlotType = (option) => {
    onUpdate({ PlotSubType: option.value });
  };
  const typeMenu = [{ value: 'ridgePlot', label: 'ridgePlot' }, { value: 'featurePlot', label: 'featurePlot' }, { value: 'dotPlot', label: 'dotPlot' }, { value: 'vlnPlot', label: 'vlnPlot' }, { value: 'markerHeatmap', label: 'markerHeatmap' }];

  let menuValue;

  if (!typeMenu) {
    menuValue = 'sample';
    disabled = true;
    toolTipText = 'The x-axis cannot be changed as this dataset has only a single sample.';
  } else {
    menuValue = config.PlotSubType;
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
            aria-label='typeMenu'
            value={{
              value: menuValue,
            }}
            onChange={changePlotType}
            labelInValue
            disabled={disabled}
            style={{ width: '100%' }}
            placeholder='Select cell set...'
            options={typeMenu}
          />
        </Tooltip>
      </Form.Item>
    </>
  );
};
SelectPlotType.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.object.isRequired,
};
export default SelectPlotType;
