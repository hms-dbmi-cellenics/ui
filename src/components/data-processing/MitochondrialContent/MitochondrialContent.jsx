import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Collapse, Row, Col, Space, Button, Tooltip, Skeleton,
} from 'antd';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from '../../../redux/actions/componentConfig';

import MitochondrialFractionHistogram from '../../plots/MitochondrialFractionHistogram';
import MitochondrialFractionScatterplot from '../../plots/MitochondrialFractionScatterplot';
import generateDataProcessingPlotUuid from '../../../utils/generateDataProcessingPlotUuid';

import PlotStyling from '../../plots/styling/PlotStyling';
import MiniPlot from '../../plots/MiniPlot';
import CalculationConfigContainer from '../CalculationConfigContainer';
import CalculationConfig from './CalculationConfig';

const { Panel } = Collapse;
const MitochondrialContent = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange,
  } = props;

  const dispatch = useDispatch();
  const filterName = 'mitochondrialContent';

  const allowedPlotActions = {
    export: true,
    compiled: false,
    source: false,
    editor: false,
  };

  const [selectedPlot, setSelectedPlot] = useState('histogram');
  const [plot, setPlot] = useState(null);

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

  const config = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config,
  );

  const expConfig = useSelector(
    (state) => state.experimentSettings.processing[filterName][sampleId]?.filterSettings
      || state.experimentSettings.processing[filterName].filterSettings,
  );

  const plotData = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.plotData,
  );

  useEffect(() => {
    Object.values(plots).forEach((obj) => {
      if (!config) {
        dispatch(loadPlotConfig(experimentId, obj.plotUuid, obj.plotType));
      }
    });
  }, [experimentId]);

  useEffect(() => {
    if (config && plotData && expConfig) {
      let newConfig = _.clone(config);

      const expConfigSettings = expConfig.methodSettings[expConfig.method];

      newConfig = _.merge(newConfig, expConfigSettings);

      setPlot(plots[selectedPlot].plot(newConfig, plotData, allowedPlotActions));
    }
  }, [expConfig, config, plotData]);

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
      controls: ['axes'],
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
    if (!config || !plotData) {
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
      <Row>
        <Col span={15}>
          {renderPlot()}
        </Col>

        <Col span={3}>
          <Space direction='vertical'>
            <Tooltip title='A high fraction of mitochondrial reads is an indicator of cell death. The usual range for this cut-off is 0.1-0.5.'>
              <Button icon={<InfoCircleOutlined />} />
            </Tooltip>
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

        <Col span={6}>
          <Collapse defaultActiveKey={['settings']}>
            <Panel header='Filtering Settings' key='settings'>
              <CalculationConfigContainer
                filterUuid={filterName}
                experimentId={experimentId}
                sampleId={sampleId}
                sampleIds={sampleIds}
                onConfigChange={onConfigChange}
                plotType='bin step'
              >
                <CalculationConfig />
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

MitochondrialContent.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
};

export default MitochondrialContent;
