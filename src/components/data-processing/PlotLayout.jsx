import React, { useEffect, useState, useCallback } from 'react';
import {
  Row, Col, Space, Skeleton, Divider, Collapse, Button,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import MiniPlot from 'components/plots/MiniPlot';
import FilterResultTable from 'components/data-processing/FilterResultTable';
import CalculationConfigContainer from 'components/data-processing/CalculationConfigContainer';
import PlotStyling from 'components/plots/styling/PlotStyling';
import PropTypes from 'prop-types';
import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
  resetPlotConfig,
} from 'redux/actions/componentConfig';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

const { Panel } = Collapse;

/*
This component is used to render the main plot and the mini plots for the
classifier, cell size distribution and mitochondrial content filters.
*/
const PlotLayout = ({
  experimentId,
  plots,
  filterName,
  filterTableUuid,
  sampleId,
  sampleIds,
  onConfigChange,
  stepDisabled,
  plotStylingControlsConfig,
  renderCalculationConfig,
  stepHadErrors,
  allowedPlotActions,
}) => {
  const dispatch = useDispatch();
  const [plot, setPlot] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(Object.keys(plots)[0]);
  const [isResetDisabled, setIsResetDisabled] = useState(true);

  const selectedPlotConfig = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config,
  );
  const filterTableData = useSelector((state) => state.componentConfig[filterTableUuid]?.plotData);

  const filterSettings = useSelector(
    (state) => state.experimentSettings.processing[filterName][sampleId].filterSettings,
  );

  const selectedPlotData = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.plotData,
  );

  const selectedConfig = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config,
  );
  const debounceSave = useCallback(
    _.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), [],
  );

  const isConfigEqual = (currentConfig, initialConfig) => {
    // Guard against undefined or null initialConfig
    if (!initialConfig) return false;

    const removeDefaultValues = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      const cleaned = { ...obj };
      delete cleaned.defaultValues;
      return cleaned;
    };

    const isEqual = Object.keys(initialConfig).every((key) => {
      // By pass plot data because we want to compare settings not data
      if (key === 'plotData') return true;
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

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedPlot].plotUuid, obj));
    debounceSave(plots[selectedPlot].plotUuid);
  };

  useEffect(() => {
    Object.values(plots).forEach((obj) => {
      if (!selectedConfig) {
        dispatch(loadPlotConfig(experimentId, obj.plotUuid, obj.plotType));
      }
    });
  }, []);

  useEffect(() => {
    if (!filterTableData) dispatch(loadPlotConfig(experimentId, filterTableUuid, 'filterTable'));
  }, []);

  useEffect(() => {
    if (selectedConfig && selectedPlotData && filterSettings) {
      const newConfig = _.clone(selectedConfig);
      // some filters have settings stored under filterSettings.methodSettings[method]
      // like the mitochondrial content one
      // so we need to check if the current filter is one of them
      const expConfigSettings = filterSettings.method ? filterSettings.methodSettings[filterSettings.method] : filterSettings;
      _.merge(newConfig, expConfigSettings);
      setPlot(plots[selectedPlot].plot(newConfig, selectedPlotData, allowedPlotActions));
    }
  }, [filterSettings, selectedConfig, selectedPlotData]);

  useEffect(() => {
    if (!selectedConfig || !plots[selectedPlot]) return;

    const initialConfig = initialPlotConfigStates[plots[selectedPlot].plotType];
    setIsResetDisabled(isConfigEqual(selectedConfig, initialConfig));
  }, [selectedConfig]);

  const onClickReset = () => {
    const { plotUuid, plotType } = plots[selectedPlot];
    dispatch(resetPlotConfig(experimentId, plotUuid, plotType));
  };

  const renderPlot = () => {
    // Spinner for main window
    if (!selectedPlotConfig || !selectedPlotData || stepHadErrors) {
      return (
        <center>
          <Skeleton.Image style={{ width: 400, height: 400 }} />
        </center>
      );
    }

    if (plot) {
      return plot;
    }
  };
  const renderMiniPlots = () => {
    if (Object.keys(plots).length > 1) {
      return (
        <Space direction='vertical'>
          {Object.entries(plots).map(([key, plotObj]) => (
            <button
              type='button'
              key={key}
              onClick={() => setSelectedPlot(key)}
              style={{
                margin: 0,
                backgroundColor: 'transparent',
                align: 'center',
                padding: '8px',
                border: '1px solid #000',
                cursor: 'pointer',
              }}
            >
              <MiniPlot
                experimentId={experimentId}
                plotUuid={plotObj.plotUuid}
                plotFn={plotObj.plot}
                actions={false}
              />
            </button>
          ))}
        </Space>
      );
    }
    return null;
  };
  return (
    <>
      <Row gutter={16}>
        <Col span={18}>
          <Row>
            <Col flex='auto'>
              {renderPlot()}
            </Col>
            <Col flex='1 0px'>
              {renderMiniPlots()}
            </Col>
          </Row>
          <Divider />
          <Row style={{ marginTop: '0.5em' }}>
            {filterTableData
              ? <FilterResultTable tableData={filterTableData} />
              : <Skeleton />}
          </Row>
        </Col>
        <Col flex='1 0px'>
          <Collapse defaultActiveKey='settings'>
            <Panel header='Filtering Settings' key='settings'>
              <CalculationConfigContainer
                filterUuid={filterName}
                sampleId={sampleId}
                sampleIds={sampleIds}
                onConfigChange={onConfigChange}
                stepDisabled={stepDisabled}
                plotType={selectedPlot}
              >
                {renderCalculationConfig()}
              </CalculationConfigContainer>
            </Panel>
            <Panel header='Plot styling' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling
                formConfig={plotStylingControlsConfig}
                config={selectedPlotConfig}
                onUpdate={updatePlotWithChanges}
              />
              <Divider />
              <Button
                type='default'
                disabled={isResetDisabled}
                block
                onClick={onClickReset}
              >
                Reset Plot
              </Button>
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};
PlotLayout.propTypes = {
  experimentId: PropTypes.string.isRequired,
  plots: PropTypes.object.isRequired,
  filterName: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
  plotStylingControlsConfig: PropTypes.arrayOf(PropTypes.shape({
    panelTitle: PropTypes.string,
    controls: PropTypes.arrayOf(PropTypes.string),
  })).isRequired,
  renderCalculationConfig: PropTypes.func.isRequired,
  stepHadErrors: PropTypes.bool.isRequired,
  filterTableUuid: PropTypes.string.isRequired,
  allowedPlotActions: PropTypes.object,
};

PlotLayout.defaultProps = {
  stepDisabled: false,
  allowedPlotActions: {
    export: true,
    compiled: false,
    source: false,
    editor: true,
  },
};
export default PlotLayout;
