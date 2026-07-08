/* eslint-disable react/require-default-props */
import React, {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import {
  Button, Card, Space, Tooltip, Skeleton,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import {
  updatePlotConfig,
  resetPlotConfig,
  savePlotConfig,
} from 'redux/actions/componentConfig';
import { getCellSets } from 'redux/selectors';
import _ from 'lodash';
import PlotStyling from 'components/plots/styling/PlotStyling';
import MultiTileContainer from 'components/MultiTileContainer';
import { getEmbeddingInitialConfig, isEmbeddingPlotType, getTotalCellCount } from 'utils/plotConfig/getEmbeddingInitialConfig';

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
  const cellSets = useSelector(getCellSets());
  const debounceSave = useCallback(
    _.debounce(() => dispatch(savePlotConfig(experimentId, plotUuid)), saveDebounceTime),
    [plotUuid],
  );
  const defaultOnUpdate = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const isConfigEqual = (currentConfig, initialConfig) => {
    const removeDefaultValues = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      const cleaned = { ...obj };
      delete cleaned.defaultValues;
      return cleaned;
    };

    const isEqual = Object.keys(initialConfig).every((key) => {
      // By pass plot data because we want to compare settings not data
      if (key === 'plotData') return true;
      // Skip defaultValues as it's metadata about defaults, not actual config
      if (key === 'defaultValues') return true;
      if (initialConfig.keepValuesOnReset?.includes(key)) return true;
      if (currentConfig[key] && typeof currentConfig[key] === 'object' && initialConfig[key] && typeof initialConfig[key] === 'object') {
        // For nested objects, exclude defaultValues from comparison as it's metadata about defaults
        const currentObj = removeDefaultValues(currentConfig[key]);
        const initialObj = removeDefaultValues(initialConfig[key]);
        return JSON.stringify(currentObj) === JSON.stringify(initialObj);
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

    // For embedding plots with cellSets available, use large-dataset-aware comparison
    let initialConfig;
    if (isEmbeddingPlotType(plotType) && cellSets?.properties && cellSets?.hierarchy) {
      const embeddingConfig = getEmbeddingInitialConfig(plotType, cellSets);
      initialConfig = embeddingConfig || initialPlotConfigStates[plotType];
    } else {
      initialConfig = initialPlotConfigStates[plotType];
    }

    setIsResetDisabled(
      isConfigEqual(config, initialConfig),
    );
  }, [config, cellSets, plotType]);

  // Auto-apply large-dataset defaults for embedding plots when config first loads with cellSets
  useEffect(() => {
    if (!isEmbeddingPlotType(plotType) || !config
      || !cellSets?.properties || !cellSets?.hierarchy) return;
    if (config.defaultValues?.largeDatasetDefaults) return; // Already applied

    const cellCount = cellSets.hierarchy?.find((node) => node.key === 'sample')
      ?.children?.reduce((sum, child) => {
        const cellIds = cellSets.properties[child.key]?.cellIds;
        return sum + (cellIds?.size || 0);
      }, 0);

    if (cellCount > 100000) {
      const largeDatasetConfig = getEmbeddingInitialConfig(plotType, cellSets);
      if (largeDatasetConfig && largeDatasetConfig !== initialPlotConfigStates[plotType]) {
        dispatch(updatePlotConfig(plotUuid, largeDatasetConfig));
        debounceSave();
      }
    }
  }, [config, cellSets, plotType, plotUuid, experimentId]);

  // True while a large-dataset embedding plot is still showing its standard marker —
  // i.e. the large-dataset defaults haven't been applied yet. Used to hold a loader
  // so the plot never flashes the standard point size/outline then re-adjusts.
  const largeDatasetPending = useMemo(() => {
    if (!isEmbeddingPlotType(plotType) || !config
      || !cellSets?.properties || !cellSets?.hierarchy) return false;
    if (config.defaultValues?.largeDatasetDefaults) return false; // already applied
    return getTotalCellCount(cellSets) > 100000;
  }, [plotType, config, cellSets]);

  const onClickReset = () => {
    // For embedding plots with large datasets, use optimized defaults
    if (isEmbeddingPlotType(plotType)) {
      const initialConfig = getEmbeddingInitialConfig(plotType, cellSets);
      if (initialConfig && initialConfig !== initialPlotConfigStates[plotType]) {
        // Preserve fields marked with keepValuesOnReset
        const keysToPreserve = initialConfig.keepValuesOnReset || [];
        const resetConfig = keysToPreserve.reduce((acc, key) => {
          if (config?.[key] !== undefined) {
            acc[key] = config[key];
          }
          return acc;
        }, initialConfig);

        dispatch(updatePlotConfig(plotUuid, resetConfig));
        debounceSave();
        onPlotReset();
        return;
      }
    }

    // Any plot may mark fields to keep across a reset (e.g. the selected sample /
    // genes); restore the defaults but carry those fields over from the live config.
    const defaultConfig = initialPlotConfigStates[plotType];
    const keysToPreserve = defaultConfig?.keepValuesOnReset || [];
    if (keysToPreserve.length > 0) {
      const resetConfig = keysToPreserve.reduce((acc, key) => {
        if (config?.[key] !== undefined) acc[key] = config[key];
        return acc;
      }, _.cloneDeep(defaultConfig));
      dispatch(updatePlotConfig(plotUuid, resetConfig));
      debounceSave();
      onPlotReset();
      return;
    }

    dispatch(resetPlotConfig(experimentId, plotUuid, plotType));
    onPlotReset();
  };

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

  const renderDefaultControlPanel = () => (
    <PlotStyling
      formConfig={plotStylingConfig}
      config={config}
      onUpdate={onUpdate ?? defaultOnUpdate}
      extraPanels={extraControlPanels}
      defaultActiveKey={defaultActiveKey}
    />
  );

  const TILE_MAP = {
    [PLOT]: {
      toolbarControls: renderPlotToolbarControls(),
      // hold a loader until large-dataset marker defaults are applied (no flash)
      component: () => (largeDatasetPending
        ? <center><Skeleton.Image active style={{ width: 400, height: 400 }} /></center>
        : children),
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
      component: () => (
        customControlPanel ?? renderDefaultControlPanel()
      ),
      style: { margin: '-10px' },
    },
  };

  const windows = {
    direction: tileDirection,
    first: PLOT,
    second: CONTROLS,
    splitPercentage: 73,
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
