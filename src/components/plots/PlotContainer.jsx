import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import {
  Collapse, Button, Skeleton, Space, Tooltip,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import _ from 'lodash';
import { resetPlotConfig } from 'redux/actions/componentConfig';

const { Panel } = Collapse;

const PlotContainer = (props) => {
  const {
    experimentId,
    plotUuid, plotType, plotInfo,
    extra, showReset, children,
  } = props;

  const dispatch = useDispatch();

  const [enableReset, setEnableReset] = useState(true);
  const { config } = useSelector((state) => state.componentConfig[plotUuid] || {});

  const checkConfigEquality = (currentConfig, initialConfig) => {
    const ignoredFields = {
      // config fields that are set dynamically on component render
      // should not be compared to their initial values
      embeddingContinuous: ['shownGene'],
      violin: ['shownGene', 'title'],
      markerHeatmap: ['selectedGenes'],
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
    dispatch(resetPlotConfig(experimentId, plotUuid, plotType));
    setEnableReset(false);
  };

  if (!config) {
    return <Skeleton active paragraph={{ rows: 1 }} title={{ width: 500 }} />;
  }

  const renderExtra = () => (
    <Space>
      {extra}
      {!showReset ? (
        <Button
          key='reset'
          type='primary'
          size='small'
          onClickReset={onClickReset}
          disabled={!enableReset}
        >
          Reset
        </Button>
      ) : ''}
      {plotInfo ? (
        <Tooltip title={plotInfo}>
          <Button size='small' icon={<InfoCircleOutlined />} />
        </Tooltip>
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
  plotInfo: PropTypes.string,
  extra: PropTypes.node || PropTypes.arrayOf(PropTypes.node),
  children: PropTypes.node,
  showReset: PropTypes.bool,
};

PlotContainer.defaultProps = {
  plotInfo: null,
  extra: null,
  children: null,
  showReset: false,
};

export default PlotContainer;
