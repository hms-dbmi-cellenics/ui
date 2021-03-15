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
      imgSrc: plot1Pic,
      plotUuid: 'mitochondrialFractionHistogram',
      plotType: 'mitochondrialFractionHistogram',
      plot: (config, plotData) => (<MitochondrialFractionHistogram experimentId={experimentId} config={config} plotData={plotData} />),
    },
    logHistogram: {
      title: 'Mitochondrial Fraction (Log)',
      imgSrc: plot2Pic,
      plotUuid: 'mitochondrialFractionLogHistogram',
      plotType: 'mitochondrialFractionLogHistogram',
      plot: (config, plotData) => (<MitochondrialFractionLogHistogram experimentId={experimentId} config={config} plotData={plotData} />),
    },
  };

  const config = useSelector((state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config);
  const plotData = useSelector((state) => state.componentConfig[plots[selectedPlot].plotUuid]?.plotData);

  useEffect(() => {
    const { plotUuid, plotType } = plots[selectedPlot];

    if (!config) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }
  }, [selectedPlot]);

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
            {Object.entries(plots).map(([key, option]) => (
              <button
                type='button'
                key={key}
                onClick={() => setSelectedPlot(key)}
                style={{
                  padding: 0, margin: 0, border: 0, backgroundColor: 'transparent',
                }}
              >
                <img
                  alt={option.title}
                  src={option.imgSrc}
                  style={{
                    height: '100px',
                    width: '100px',
                    align: 'center',
                    padding: '8px',
                    border: '1px solid #000',
                  }}
                />
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
