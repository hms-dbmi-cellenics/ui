/* eslint-disable react/require-default-props */
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import {
  Button, Card, Skeleton, Space, Tooltip,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import {
  updatePlotConfig,
  resetPlotConfig,
  savePlotConfig,
} from 'redux/actions/componentConfig';
import _ from 'lodash';
import PlotStyling from 'components/plots/styling/PlotStyling';
import MultiTileContainer from 'components/MultiTileContainer';

const PLOT = 'Plot';
const CONTROLS = 'Controls';
const DEFAULT_ORIENTATION = 'row';

const PlotContainer = (props) => {
  const {
    experimentId,
    plotUuid, plotType, plotInfo,
    plotStylingConfig, defaultActiveKey,
    extraToolbarControls, extraControlPanels, customControlPanel, controlsOnly,
    showResetButton, onPlotReset,
    children,
    onUpdate,
    saveDebounceTime,
  } = props;

  const dispatch = useDispatch();

  const [isResetDisabled, setIsResetDisabled] = useState(true);
  const [tileDirection, setTileDirection] = useState(DEFAULT_ORIENTATION);
  const { config } = useSelector((state) => state.componentConfig[plotUuid] || {});
  const debounceSave = useCallback(
    _.debounce(() => dispatch(savePlotConfig(experimentId, plotUuid)), saveDebounceTime), [plotUuid],
  );

  const defaultOnUpdate = (obj) => {
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

    debounceSave();

    setIsResetDisabled(
      isConfigEqual(config, initialPlotConfigStates[plotType]),
    );
  }, [config]);

  const onClickReset = () => {
    onPlotReset();
    dispatch(resetPlotConfig(experimentId, plotUuid, plotType));
    setIsResetDisabled(true);
  };

  if (!config) {
    return (
      <div style={{ paddingLeft: '2em' }}>
        <Skeleton active paragraph={{ rows: 1 }} title={{ width: 500 }} />
      </div>
    );
  }

  const renderPlotToolbarControls = () => (
    <Space style={{ marginRight: '0.5em' }}>
      {extraToolbarControls}
      {showResetButton ? (
        <Button
          key='reset-plot'
          type='primary'
          size='small'
          onClick={onClickReset}
          disabled={isResetDisabled}
        >
          Reset Plot
        </Button>
      ) : ''}
      {plotInfo ? (
        <Tooltip title={plotInfo}>
          <Button size='small' icon={<InfoCircleOutlined />} />
        </Tooltip>
      ) : ''}
    </Space>
  );

  const renderDefaultControlPanel = (height) => (
    <div style={{ height, overflowY: 'auto' }}>
      <PlotStyling
        formConfig={plotStylingConfig}
        config={config}
        onUpdate={onUpdate ?? defaultOnUpdate}
        extraPanels={extraControlPanels}
        defaultActiveKey={defaultActiveKey}
      />
    </div>
  );

  const TILE_MAP = {
    [PLOT]: {
      toolbarControls: renderPlotToolbarControls(),
      component: () => children,
      style: {
        display: 'flex',
        backgroundColor: 'white',
        justifyContent: 'center',
        alignContent: 'center',
        height: '100%',
      },
    },
    [CONTROLS]: {
      toolbarControls: [],
      component: (width, height) => (
        customControlPanel ?? renderDefaultControlPanel(height)
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

  if (controlsOnly) {
    return (
      <div style={{
        padding: '5px', background: '#aab5c1', width: '100%', height: '100%',
      }}
      >
        <Card style={{ borderColor: '#FFFFFF' }}>
          <div style={{
            height: '100%', width: '100%', margin: 0,
          }}
          >
            {TILE_MAP[CONTROLS].component()}
          </div>
        </Card>
      </div>
    );
  }

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
  plotInfo: PropTypes.node,
  plotStylingConfig: PropTypes.arrayOf(PropTypes.object),
  defaultActiveKey: PropTypes.string || PropTypes.arrayOf(PropTypes.string),
  extraToolbarControls: PropTypes.node || PropTypes.arrayOf(PropTypes.node),
  extraControlPanels: PropTypes.node || PropTypes.arrayOf(PropTypes.node),
  customControlPanel: PropTypes.node,
  controlsOnly: PropTypes.bool,
  children: PropTypes.node,
  onUpdate: PropTypes.func,
  showResetButton: PropTypes.bool,
  onPlotReset: PropTypes.func,
  saveDebounceTime: PropTypes.number,
};

PlotContainer.defaultProps = {
  plotInfo: null,
  extraToolbarControls: null,
  extraControlPanels: null,
  customControlPanel: null,
  controlsOnly: false,
  children: null,
  onUpdate: undefined,
  showResetButton: true,
  onPlotReset: () => { },
  saveDebounceTime: 2000,
};

export default PlotContainer;
