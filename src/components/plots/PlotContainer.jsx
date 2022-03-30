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

const ResetButton = ({ onClickReset, resetDisabled }) => (
  <Button
    key='reset'
    type='primary'
    size='small'
    onClick={onClickReset}
    disabled={resetDisabled}
  >
    Reset
  </Button>
);

ResetButton.propTypes = {
  onClickReset: PropTypes.func.isRequired,
  resetDisabled: PropTypes.bool.isRequired,
};

const PlotContainer = (props) => {
  const {
    experimentId, plotUuid, plotType,
    extra, disableReset, children,
  } = props;

  const dispatch = useDispatch();

  const [enableReset, setEnableReset] = useState(true);
  const { config } = useSelector((state) => state.componentConfig[plotUuid] || {});

  const checkConfigEquality = (currentConfig, initialConfig) => {
    const ignoredFields = {
      // config fields that are set dynamically on component render
      // should not be compared to their initial values
      frequency: ['proportionGrouping', 'xAxisGrouping'],
      embeddingContinuous: ['shownGene'],
      violin: ['shownGene'],
      markerHeatmap: ['selectedGenes'],
    };

    const hasDifferentValue = Object.keys(initialConfig).some((key) => {
      if (ignoredFields[plotType]?.includes(key)) return false;
      if (typeof currentConfig[key] === 'object') {
        return JSON.stringify(currentConfig[key]) === JSON.stringify(initialConfig[key]);
      }

      return currentConfig[key] !== initialConfig[key];
    });

    return hasDifferentValue;
  };

  useEffect(() => {
    if (!config) {
      return;
    }

    if (_.isEqualWith(config, initialPlotConfigStates[plotType], checkConfigEquality)) {
      setEnableReset(true);
    }

    setEnableReset(false);
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
      {!disableReset ? (
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
      <Panel header='Preview' key='plot' extra={renderExtra()}>
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
  disableReset: PropTypes.bool,
};

PlotContainer.defaultProps = {
  extra: null,
  children: null,
  disableReset: false,
};

export default PlotContainer;
