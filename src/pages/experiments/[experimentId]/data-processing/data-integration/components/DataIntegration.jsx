import React, { useState } from 'react';
import {
  Row, Col, Button, Tooltip,
} from 'antd';
import _ from 'lodash';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';

import PlotStyling from '../../filter-cells/components/PlotStyling';
import CalculationConfig from './CalculationConfig';
import ElbowPlot from './plots/ElbowPlot';

const defaultStylingConfig = {
  xAxisText: 'Principal Components',
  yAxisText: 'Proportion of Variance Explained',
  xDefaultTitle: 'Principal Components',
  yDefaultTitle: 'Proportion of Variance Explained',
  titleSize: 12,
  titleText: '',
  titleDx: 10,
  titleAnchor: 'start',
  masterFont: 'sans-serif',
  masterSize: 13,
  axisTitlesize: 13,
  axisTicks: 13,
  axisOffset: 0,
  transGrid: 10,
  width: 530,
  height: 400,
  maxWidth: 720,
  maxHeight: 530,
};

const DataIntegration = () => {
  const [plotConfig, setPlotConfig] = useState(defaultStylingConfig);

  const updatePlotWithChanges = (plotConfigUpdates) => {
    const newPlotConfig = _.cloneDeep(plotConfig);
    _.merge(newPlotConfig, plotConfigUpdates);

    setPlotConfig(newPlotConfig);
  };

  return (
    <>
      <Row>
        <Col span={16}>
          <ElbowPlot plotConfig={plotConfig} />
        </Col>
        <Col span={1}>
          <Tooltip title='Dimensionality reduction is necessary to summarise and visualise single cell data. The most common method is Principal Component Analysis (PCA). The user sets the maximum number of PCs.'>
            <Button icon={<InfoCircleOutlined />} />
          </Tooltip>
        </Col>
        <Col span={7}>
          <CalculationConfig />
          <PlotStyling
            config={plotConfig}
            onUpdate={updatePlotWithChanges}
            singlePlot
          />
        </Col>
      </Row>
    </>
  );
};

export default DataIntegration;
