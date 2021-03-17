import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import {
  Collapse, Row, Col, Space, Tooltip, Button,
} from 'antd';
import PropTypes from 'prop-types';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import Loader from '../../Loader';
import plot1Pic from '../../../../static/media/plot3.png';
import plot2Pic from '../../../../static/media/plot4.png';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from '../../../redux/actions/componentConfig';

import MitochondrialFractionHistogram from '../../plots/mitochondrialFractionHistogram';
import MitochondrialFractionLogHistogram from '../../plots/mitochondrialFractionLogHistogram';

import PlotStyling from '../../plots/styling/PlotStyling';
import MiniPlot from '../../plots/MiniPlot';
import CalculationConfig from './CalculationConfig';

const { Panel } = Collapse;
const MitochondrialContent = (props) => {
  const {
    experimentId,
  } = props;

  const dispatch = useDispatch();

  const [selectedPlot, setSelectedPlot] = useState('histogram');
  const [plot, setPlot] = useState(false);

  const debounceSave = useCallback(_.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), []);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedPlot].plotUuid, obj));
    debounceSave(plots[selectedPlot].plotUuid);
  };

  const plots = {
    histogram: {
      title: 'Mitochondrial Fraction',
      plotUuid: 'mitochondrialFractionHistogram',
      plotType: 'mitochondrialFractionHistogram',
      plot: (config, plotData, actions) => (<MitochondrialFractionHistogram experimentId={experimentId} config={config} plotData={plotData} actions={actions} />),
    },
    logHistogram: {
      title: 'Mitochondrial Fraction (Log)',
      plotUuid: 'mitochondrialFractionLogHistogram',
      plotType: 'mitochondrialFractionLogHistogram',
      plot: (config, plotData, actions) => (<MitochondrialFractionLogHistogram experimentId={experimentId} config={config} plotData={plotData} actions={actions} />),
    },
  };

  const config = useSelector((state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config);
  const plotData = useSelector((state) => state.componentConfig[plots[selectedPlot].plotUuid]?.plotData);

  useEffect(() => {
    Object.values(plots).forEach((obj) => {
      if (!config) {
        dispatch(loadPlotConfig(experimentId, obj.plotUuid, obj.plotType));
      }
    });
  }, [experimentId]);

  useEffect(() => {
    if (config && plotData) {
      setPlot(plots[selectedPlot].plot(config, plotData));
    }
  }, [config, plotData]);

  const plotStylingConfig = [
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
          <Loader experimentId={experimentId} />
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
                <MiniPlot experimentId={experimentId} plotUuid={plotObj.plotUuid} plotFn={plotObj.plot} actions={false} />
              </button>

            ))}
          </Space>
        </Col>

        <Col span={6}>
          <Collapse defaultActiveKey={['settings']}>
            <Panel header='Filtering Settings' key='settings'>
              <CalculationConfig experimentId={experimentId} />
            </Panel>
            <Panel header='Plot styling' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling formConfig={plotStylingConfig} config={config} onUpdate={updatePlotWithChanges} />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

MitochondrialContent.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default MitochondrialContent;
