import React, { useEffect, useState, useCallback } from 'react';
import {
  Row, Col, Space, Skeleton, Divider, Collapse,
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
} from 'redux/actions/componentConfig';

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
