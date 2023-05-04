import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Collapse, Row, Col, Space, Skeleton, Divider,
} from 'antd';

import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from 'redux/actions/componentConfig';

import MitochondrialFractionHistogram from '../../plots/MitochondrialFractionHistogram';
import MitochondrialFractionScatterplot from '../../plots/MitochondrialFractionScatterplot';

import PlotStyling from '../../plots/styling/PlotStyling';
import MiniPlot from '../../plots/MiniPlot';
import CalculationConfigContainer from '../CalculationConfigContainer';
import CalculationConfig from './CalculationConfig';
import FilterResultTable from '../FilterResultTable';

const { Panel } = Collapse;

const filterName = 'mitochondrialContent';

const allowedPlotActions = {
  export: true,
  compiled: false,
  source: false,
  editor: false,
};

const MitochondrialContent = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange, stepDisabled, stepHadErrors,
  } = props;

  const dispatch = useDispatch();

  const [selectedPlot, setSelectedPlot] = useState('histogram');
  const [plot, setPlot] = useState(null);
  const filterTableUuid = generateDataProcessingPlotUuid(sampleId, filterName, 2);
  const filterTableData = useSelector((state) => state.componentConfig[filterTableUuid]?.plotData);

  const debounceSave = useCallback(
    _.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), [],
  );

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedPlot].plotUuid, obj));
    debounceSave(plots[selectedPlot].plotUuid);
  };

  const plots = {
    histogram: {
      title: 'Mitochondrial Fraction',
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 0),
      plotType: 'mitochondrialFractionHistogram',
      plot: (config, plotData, actions) => (
        <MitochondrialFractionHistogram
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
    logHistogram: {
      title: 'Mitochondrial Fraction (Log)',
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 1),
      plotType: 'mitochondrialFractionLogHistogram',
      plot: (config, plotData, actions) => (
        <MitochondrialFractionScatterplot
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
  };

  const selectedConfig = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config,
  );

  const expConfig = useSelector(
    (state) => state.experimentSettings.processing[filterName][sampleId].filterSettings,
  );

  const selectedPlotData = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.plotData,
  );

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
      let newConfig = _.clone(selectedConfig);

      const expConfigSettings = expConfig.methodSettings[expConfig.method];

      newConfig = _.merge(newConfig, expConfigSettings);

      setPlot(plots[selectedPlot].plot(newConfig, selectedPlotData, allowedPlotActions));
    }
  }, [expConfig, selectedConfig, selectedPlotData]);

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Legend',
      controls: ['legend'],
    },
    {
      panelTitle: 'Plot Dimensions',
      controls: ['dimensions'],
    },
    {
      panelTitle: 'Axes',
      controls: ['axesWithRanges'],
    },
    {
      panelTitle: 'Title',
      controls: ['title'],
    },
    {
      panelTitle: 'Font',
      controls: ['font'],
    },
  ];

  const renderPlot = () => {
    // Spinner for main window
    if (!selectedConfig || !selectedPlotData || stepHadErrors) {
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
                plotType={selectedPlot}
                stepDisabled={stepDisabled}
              >
                <CalculationConfig />
              </CalculationConfigContainer>
            </Panel>
            <Panel header='Plot styling' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling
                formConfig={plotStylingControlsConfig}
                config={selectedConfig}
                onUpdate={updatePlotWithChanges}
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

MitochondrialContent.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
  stepHadErrors: PropTypes.bool.isRequired,
};

MitochondrialContent.defaultProps = {
  stepDisabled: false,
};

export default MitochondrialContent;
