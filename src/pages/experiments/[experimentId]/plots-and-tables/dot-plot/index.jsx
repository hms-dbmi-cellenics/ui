import React, { useEffect } from 'react';

import {
  Row,
  Col,
  Space,
  Collapse,
  Skeleton,
  Radio,
  InputNumber,
  Select,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import DotPlot from 'components/plots/DotPlot';
import Header from '../../../../../components/plots/Header';

import PlotStyling from '../../../../../components/plots/styling/PlotStyling';
import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../redux/actions/componentConfig';

import Loader from '../../../../../components/Loader';

const { Panel } = Collapse;
const plotUuid = 'dotPlotMain';
const plotType = 'dotPlot';
const route = {
  path: 'dot-plot',
  breadcrumbName: 'Dot plot',
};

const plotStylingControlsConfig = [
  {
    panelTitle: 'Main schema',
    controls: ['dimensions'],
    children: [
      {
        panelTitle: 'Title',
        controls: ['title'],
      },
      {
        panelTitle: 'Font',
        controls: ['font'],
      },
    ],
  },
  {
    panelTitle: 'Axes and Margins',
    controls: ['axes'],
  },
  {
    panelTitle: 'Legend',
    controls: [
      {
        name: 'legend',
        props: {
          option: {
            positions: 'top-bottom',
          },
        },
      },
    ],
  },
];

const dotPlot = (props) => {
  const { experimentId } = props;

  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);

  useEffect(() => {
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, []);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  if (!config) {
    return <Skeleton />;
  }

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene selection' key='gene-selection'>
        <Space direction='vertical' size='middle'>
          <Radio.Group
            onChange={(e) => updatePlotWithChanges({ markerGenes: e.target.value })}
            value={config.markerGenes}
          >
            <Radio value>Marker genes</Radio>
            <Radio value={false}>Custom genes</Radio>
          </Radio.Group>
          {
            !config.markerGenes
            && (
              <Space direction='vertical' size='small'>
                <p>Type in a gene name and hit space or enter to add it to the heatmap.</p>
                <Select
                  mode='tags'
                  style={{ width: '100%' }}
                  placeholder='Select genes...'
                  onChange={(genes) => updatePlotWithChanges({ genes })}
                  value={config.genes}
                  tokenSeparators={[' ']}
                  notFoundContent='No gene added yet.'
                />
              </Space>
            )
          }
          <Space>
            Number of genes
            <InputNumber
              size='small'
              value={config.nGenes}
              onChange={(value) => updatePlotWithChanges({ nGenes: value })}
            />
          </Space>
        </Space>
      </Panel>
    </>
  );

  const renderPlot = () => {
    if (!config) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <center>
        <DotPlot config={config} />
      </center>
    );
  };

  return (
    <div style={{ paddingLeft: 32, paddingRight: 32 }}>
      <Header
        plotUuid={plotUuid}
        experimentId={experimentId}
        finalRoute={route}
      />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                {renderPlot()}
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <PlotStyling
              formConfig={plotStylingControlsConfig}
              config={config}
              onUpdate={updatePlotWithChanges}
              renderExtraPanels={renderExtraPanels}
              defaultActiveKey={['gene-selection']}
            />
          </Space>
        </Col>
      </Row>
    </div>
  );
};

dotPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default dotPlot;
