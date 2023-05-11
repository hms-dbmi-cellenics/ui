import React, { useEffect, useCallback } from 'react';
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

import FeaturesVsUMIsScatterplot from '../../plots/FeaturesVsUMIsScatterplot';

import PlotStyling from '../../plots/styling/PlotStyling';
import CalculationConfigContainer from '../CalculationConfigContainer';
import CalculationConfig from './CalculationConfig';
import FilterResultTable from '../FilterResultTable';

const { Panel } = Collapse;

const allowedPlotActions = {
  export: true,
  compiled: false,
  source: true,
  editor: false,
};

const filterName = 'numGenesVsNumUmis';
const plotType = 'featuresVsUMIsScatterplot';

const GenesVsUMIs = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange, stepDisabled, stepHadErrors, onQCRunClick,
  } = props;

  const plotUuid = generateDataProcessingPlotUuid(sampleId, filterName, 0);
  const filterTableUuid = generateDataProcessingPlotUuid(sampleId, filterName, 1);
  const filterTableData = useSelector((state) => state.componentConfig[filterTableUuid]?.plotData);

  const dispatch = useDispatch();

  const debounceSave = useCallback(
    _.debounce((uuid) => dispatch(savePlotConfig(experimentId, uuid)), 2000), [],
  );

  const config = useSelector(
    (state) => state.componentConfig[plotUuid]?.config,
  );
  const expConfig = useSelector(
    (state) => state.experimentSettings.processing[filterName][sampleId].filterSettings,
  );
  const plotData = useSelector(
    (state) => state.componentConfig[plotUuid]?.plotData,
  );

  useEffect(() => {
    if (!config) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }
  }, [config]);

  useEffect(() => {
    if (!filterTableData) dispatch(loadPlotConfig(experimentId, filterTableUuid, 'filterTable'));
  }, []);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
    debounceSave(plotUuid);
  };

  const plotStylingControlsConfig = [
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
    if (!config || !plotData || stepHadErrors) {
      return (
        <center>
          <Skeleton.Image style={{ width: 400, height: 400 }} />
        </center>
      );
    }

    if (config && plotData) {
      return (
        <FeaturesVsUMIsScatterplot
          config={config}
          plotData={plotData}
          actions={allowedPlotActions}
          expConfig={expConfig}
        />
      );
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
            <Space direction='vertical' style={{ width: '100%' }} />
            <Panel header='Filtering Settings' key='settings'>
              <CalculationConfigContainer
                filterUuid={filterName}
                sampleId={sampleId}
                sampleIds={sampleIds}
                onConfigChange={onConfigChange}
                plotType='unused'
                stepDisabled={stepDisabled}
              >
                <CalculationConfig
                  rerunRequired={plotData?.linesData && !plotData?.linesData[0]?.length}
                  onQCRunClick={onQCRunClick}
                />
              </CalculationConfigContainer>
            </Panel>
            <Panel header='Plot styling' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling
                formConfig={plotStylingControlsConfig}
                config={config}
                onUpdate={updatePlotWithChanges}
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

GenesVsUMIs.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
  stepHadErrors: PropTypes.bool.isRequired,
  onQCRunClick: PropTypes.func.isRequired,
};

GenesVsUMIs.defaultProps = {
  stepDisabled: false,
};

export default GenesVsUMIs;
