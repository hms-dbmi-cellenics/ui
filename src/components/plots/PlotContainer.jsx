import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import {
  Collapse, Button, Skeleton, Space,
} from 'antd';

import { LOAD_CONFIG } from 'redux/actionTypes/componentConfig';

import { savePlotConfig } from 'redux/actions/componentConfig/index';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import _ from 'lodash';

const { Panel } = Collapse;

const ResetButton = ({ onClickReset, disabled }) => (
  <Button
    key='reset'
    type='primary'
    size='small'
    onClick={onClickReset}
    disabled={disabled}
  >
    Reset
  </Button>
);

ResetButton.propTypes = {
  onClickReset: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

const PlotContainer = (props) => {
  const {
    experimentId, plotUuid, plotType,
    extra, showReset, children,
  } = props;

  const dispatch = useDispatch();

  const [enableReset, setEnableReset] = useState(true);
  const { config } = useSelector((state) => state.componentConfig[plotUuid] || {});

  const checkConfigEquality = (currentConfig, initialConfig) => {
    const ignoredFields = {
      // config fields that are set dynamically on component render
      // should not be compared to their initial values
      frequency: ['proportionGrouping', 'xAxisGrouping'],
      embeddingCategorical: ['axes'],
      embeddingContinuous: ['shownGene', 'axes'],
      violin: ['shownGene'],
      markerHeatmap: ['selectedGenes', 'groupedTracks'],
      DotPlot: ['selectedGenes'],
    };

    const areAllValuesTheSame = Object.keys(initialConfig).every((key) => {
      // By pass plot data because we want to compare settings not data
      if (key === 'plotData') return true;
      if (ignoredFields[plotType]?.includes(key)) return true;
      if (typeof currentConfig[key] === 'object') {
        return JSON.stringify(currentConfig[key]) === JSON.stringify(initialConfig[key]);
      }

      return currentConfig[key] === initialConfig[key];
    });

    return areAllValuesTheSame;
  };

  useEffect(() => {
    if (!config) {
      return;
    }

    if (_.isEqualWith(config, initialPlotConfigStates[plotType], checkConfigEquality)) {
      setEnableReset(false);
      return;
    }

    setEnableReset(true);
  }, [config]);

  const onClickReset = (event) => {
    event.stopPropagation();
    dispatch({
      type: LOAD_CONFIG,
      payload: {
        experimentId,
        plotUuid,
        plotType,
        config: _.cloneDeep(initialPlotConfigStates[plotType]),
      },
    });
    dispatch(savePlotConfig(experimentId, plotUuid));
    setEnableReset(false);
  };

  if (!config) {
    return <Skeleton active paragraph={{ rows: 1 }} title={{ width: 500 }} />;
  }

  const renderExtra = () => (
    <Space>
      {extra}
      {!showReset ? (
        <ResetButton
          key='reset'
          onClickReset={onClickReset}
          disabled={!enableReset}
        />
      ) : ''}
    </Space>
  );

  return (
    <Collapse defaultActiveKey='plot'>
      <Panel key='plot' extra={renderExtra()} collapsible='disabled' ghost showArrow={false}>
        {children}
      </Panel>
    </Collapse>
  );
};

PlotContainer.propTypes = {
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
  plotType: PropTypes.string.isRequired,
  extra: PropTypes.node || PropTypes.arrayOf(PropTypes.node),
  children: PropTypes.node,
  showReset: PropTypes.bool,
};

PlotContainer.defaultProps = {
  extra: null,
  children: null,
  showReset: false,
};

export default PlotContainer;
