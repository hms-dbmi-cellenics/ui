/* eslint-disable react/require-default-props */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import {
  Button, Skeleton, Space, Tooltip,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import {
  updatePlotConfig,
  resetPlotConfig,
} from 'redux/actions/componentConfig';

import PlotStyling from 'components/plots/styling/PlotStyling';
import MultiTileContainer from 'components/MultiTileContainer';

const PLOT = 'Plot';
const CONTROLS = 'Controls';
const DEFAULT_ORIENTATION = 'column';

const PlotContainer = (props) => {
  const {
    experimentId,
    plotUuid, plotType, plotInfo,
    plotStylingConfig, defaultActiveKey,
    extraToolbarControls, extraControlPanels,
    enableReset,
    children,
  } = props;

  const dispatch = useDispatch();

  const [resetEnabled, setEnableReset] = useState(enableReset);
  const [tileDirection, setTileDirection] = useState(DEFAULT_ORIENTATION);
  const { config } = useSelector((state) => state.componentConfig[plotUuid] || {});

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const isConfigEqual = (currentConfig, initialConfig) => {
    const isEqual = Object.keys(initialConfig).every((key) => {
      // By pass plot data because we want to compare settings not data
      if (key === 'plotData') return true;
      if (initialConfig.keepValuesOnReset?.includes(key)) return true;
      if (typeof currentConfig[key] === 'object') {
        return JSON.stringify(currentConfig[key]) === JSON.stringify(initialConfig[key]);
      }

      return currentConfig[key] === initialConfig[key];
    });

    return isEqual;
  };

  const handleResize = () => {
    const direction = window.innerWidth > 1024 ? 'row' : 'column';
    if (tileDirection !== direction) setTileDirection(direction);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!config) {
      return;
    }

    if (isConfigEqual(config, initialPlotConfigStates[plotType])) {
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

  const renderPlotToolbarControls = () => (
    <Space>
      {extraToolbarControls}
      {!enableReset ? (
        <Button
          key='reset'
          type='primary'
          size='small'
          onClick={onClickReset}
          disabled={!resetEnabled}
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

  const TILE_MAP = {
    [PLOT]: {
      toolbarControls: renderPlotToolbarControls(),
      component: () => children,
      style: { backgroundColor: 'white' },
    },
    [CONTROLS]: {
      toolbarControls: [],
      component: () => (
        <PlotStyling
          formConfig={plotStylingConfig}
          config={config}
          onUpdate={updatePlotWithChanges}
          extraPanels={extraControlPanels}
          defaultActiveKey={defaultActiveKey}
        />
      ),
      style: { margin: '-10px' },
    },
  };

  const windows = {
    direction: tileDirection,
    first: PLOT,
    second: CONTROLS,
    splitPercentage: 75,
  };

  return (
    <MultiTileContainer
      style={{ backgroundColor: 'white' }}
      tileMap={TILE_MAP}
      initialArrangement={windows}
    />
  );
};

PlotContainer.propTypes = {
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
  plotType: PropTypes.string.isRequired,
  plotInfo: PropTypes.string,
  plotStylingConfig: PropTypes.arrayOf(PropTypes.object),
  defaultActiveKey: PropTypes.string || PropTypes.arrayOf(PropTypes.string),
  extraToolbarControls: PropTypes.node || PropTypes.arrayOf(PropTypes.node),
  extraControlPanels: PropTypes.node || PropTypes.arrayOf(PropTypes.node),
  children: PropTypes.node,
  enableReset: PropTypes.bool,
};

PlotContainer.defaultProps = {
  plotInfo: null,
  extraToolbarControls: null,
  extraControlPanels: null,
  children: null,
  enableReset: false,
};

export default PlotContainer;
