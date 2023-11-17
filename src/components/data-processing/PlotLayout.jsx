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
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';

const { Panel } = Collapse;

const PlotLayout = ({
  experimentId,
  plots,
  selectedPlot,
  setSelectedPlot,
  filterName,
  sampleId,
  sampleIds,
  onConfigChange,
  stepDisabled,
  plotStylingControlsConfig,
  renderCalculationConfig,
  stepHadErrors,
}) => {
  const allowedPlotActions = {
    export: true,
    compiled: false,
    source: false,
    editor: false,
  };
  const dispatch = useDispatch();
  const [plot, setPlot] = useState(null);

  const selectedPlotConfig = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config,
  );
  const filterTableUuid = generateDataProcessingPlotUuid(sampleId, filterName, 3);
  const filterTableData = useSelector((state) => state.componentConfig[filterTableUuid]?.plotData);

  const expConfig = useSelector(
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
    if (selectedConfig && selectedPlotData && expConfig) {
      const newConfig = _.clone(selectedConfig);
      _.merge(newConfig, expConfig);
      setPlot(plots[selectedPlot].plot(newConfig, selectedPlotData, allowedPlotActions));
    }
  }, [expConfig, selectedConfig, selectedPlotData]);
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

  return (
    <>
      <Row gutter={16}>
        <Col span={18}>
          <Row>
            <Col flex='auto'>
              {renderPlot()}
            </Col>

            <Col flex='1 0px'>
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
                plotType='unused'
                stepDisabled={stepDisabled}
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
  setSelectedPlot: PropTypes.func.isRequired,
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
  selectedPlot: PropTypes.string.isRequired,
  stepHadErrors: PropTypes.bool.isRequired,

};

PlotLayout.defaultProps = {
  stepDisabled: false,
};
export default PlotLayout;
