import React from 'react';

import {
  PageHeader, Row, Col, Space, Collapse,
} from 'antd';

import { Vega } from 'react-vega';

import _ from 'lodash';
import differentialExpression from './differential_expression.json';

import ThresholdsGuidesEditor from './components/DEVolcano/ThresholdsGuidesEditor';
import MarkersEditor from './components/DEVolcano/MarkersEditor';
import PointDesign from './components/DEVolcano/PointDesign';
import TitleDesign from './components/DEVolcano/TitleDesign';

import SchemaDesign from './components/DEVolcano/SchemaDesign';
import AxesDesign from './components/DEVolcano/AxesDesign';

// const differentialExpression = JSON.stringify(_.first([differentialExpression], 15));


const { Panel } = Collapse;

// eslint-disable-next-line react/prefer-stateless-function
class PlotsAndTablesViewPage extends React.Component {
  constructor(props) {
    super(props);

    this.routes = [
      {
        path: 'index',
        breadcrumbName: 'Experiments',
      },
      {
        path: 'first',
        breadcrumbName: 'TGFB1 CABG study',
      },
      {
        path: 'second',
        breadcrumbName: 'Plots and tables',
      },
      {
        path: 'third',
        breadcrumbName: 'Disease vs. control (Differential expression)',
      },
    ];

    this.defaultConfig = {
      width: 500,
      height: 500,
      noDifferenceColor: '#aaaaaa',
      significantUpregulatedColor: '#0000ffaa',
      significantDownregulatedColor: '#ff0000',
      notSignificantDownregulatedColor: '#aaaaaa',
      notSignificantUpregulatedColor: '#aaaaaa',
      significantChangeDirectionUnknownColor: '#aaaaaa',
      logFoldChangeDomain: null,
      maxNegativeLogpValueDomain: null,
      pvalueThreshold: 0.05,
      logFoldChangeThreshold: 1,
      logFoldChangeTickCount: 5,
      negativeLogpValueTickCount: 5,
      downsampleRatio: 0.9,
      showLogFoldChangeThresholdGuides: false,
      showpvalueThresholdGuides: false,
      thresholdGuideWidth: 1,
      logFoldChangeThresholdColor: '#ff0000',
      pvalueThresholdColor: '#ff0000',

      pointsize: 32,
      pointstyle: 'circle',
      pointOpa: 5,
      strokeOpa: 1,
      strokeCol: '#000000',

      axistitlesize: 13,
      axisticks: 13,
      colGrid: '#000000',
      widthGrid: 10,
      transGrid: 5,
      axesOffset: 10,
      lineWidth: 2,

      titleText: '',
      titleSize: 20,
      titleAnchor: 'start',
    };

    this.state = {
      config: _.cloneDeep(this.defaultConfig),
      data: differentialExpression,
    };

    this.updatePlotWithChanges = this.updatePlotWithChanges.bind(this);
  }

  generateData() {
    let { data } = this.state;
    const { config } = this.state;
    data = _.cloneDeep(data);

    data = data.filter((datum) => {
      // Downsample insignificant, not changing genes by the appropriate amount.
      const isSignificant = (
        datum.log2FoldChange < config.logFoldChangeThreshold * -1
        || datum.log2FoldChange > config.logFoldChangeThreshold)
        && datum.pvalue < config.pvalueThreshold;

      if (isSignificant) {
        return true;
      }

      if (Math.random() > config.downsampleRatio) {
        return true;
      }

      return false;
    }).map((datum) => {
      // Add a status to each gene depending on where they lie in the system.
      // Note: the numbers in these names are important. In the schema, we
      // order the colors by the names, and the names are declared sorted,
      // so they must be alphabetically ordered.
      let status;
      if (datum.pvalue <= config.pvalueThreshold
        && datum.log2FoldChange >= config.logFoldChangeThreshold) {
        status = '1_significantUpregulated';
      } else if (datum.pvalue <= config.pvalueThreshold
        && datum.log2FoldChange <= config.logFoldChangeThreshold * -1) {
        status = '2_significantDownregulated';
      } else if (datum.pvalue > config.pvalueThreshold
        && datum.log2FoldChange >= config.logFoldChangeThreshold) {
        status = '3_notSignificantUpregulated';
      } else if (datum.pvalue > config.pvalueThreshold
        && datum.log2FoldChange <= config.logFoldChangeThreshold * -1) {
        status = '4_notSignificantDownregulated';
      } else if (datum.pvalue <= config.pvalueThreshold
        && datum.log2FoldChange > config.logFoldChangeThreshold * -1
        && datum.log2FoldChange < config.logFoldChangeThreshold) {
        status = '5_significantChangeDirectionUnknown';
      } else {
        status = '6_noDifference';
      }

      // eslint-disable-next-line no-param-reassign
      datum.status = status;

      return datum;
    });

    return data;
  }

  generateSpec() {
    const { config } = this.state;

    const logFoldChangeFilterExpr = (config.logFoldChangeDomain)
      ? `datum.log2FoldChange > ${config.logFoldChangeDomain * -1} && datum.log2FoldChange < ${config.logFoldChangeDomain}`
      : 'true';

    const negativeLogpValueFilterExpr = (config.maxNegativeLogpValueDomain)
      ? `datum.neglogpvalue < ${config.maxNegativeLogpValueDomain}`
      : 'true';

    const logFoldChangeThresholdColor = config.showLogFoldChangeThresholdGuides
      ? config.logFoldChangeThresholdColor
      : '#ffffff00';

    const pvalueThresholdColor = config.showpvalueThresholdGuides
      ? config.pvalueThresholdColor
      : '#ffffff00';

    // Domain specifiers for the volcano plot axes.
    // If a logFoldChangeDomain is defined by the user (e.g. through the
    // interface by deselecting Auto and entering a custom value), use
    // their specified range. If not, scale the plot based on the range of
    // the data in the set.
    const logFoldChangeDomain = config.logFoldChangeDomain
      ? [config.logFoldChangeDomain * -1, config.logFoldChangeDomain]
      : { data: 'differentialExpression', field: 'log2FoldChange' };

    const maxNegativeLogpValueDomain = config.maxNegativeLogpValueDomain
      ? [0, config.maxNegativeLogpValueDomain]
      : { data: 'differentialExpression', field: 'neglogpvalue' };

    return {
      $schema: 'https://vega.github.io/schema/vega/v5.json',
      description: 'A basic scatter plot example depicting automobile statistics.',
      width: config.width || this.defaultConfig.width,
      height: config.height || this.defaultConfig.height,
      padding: 5,


      data: [
        {
          name: 'differentialExpression',
          transform: [
            {
              type: 'filter',
              expr: "datum.log2FoldChange !== 'NA' && datum.pvalue !== 'NA'",
            },
            {
              type: 'formula',
              as: 'neglogpvalue',
              expr: '-(log(datum.pvalue) / LN10)',
            },
            {
              type: 'filter',
              expr: logFoldChangeFilterExpr,
            },
            {
              type: 'filter',
              expr: negativeLogpValueFilterExpr,
            },
          ],
        },
      ],


      scales: [
        {
          name: 'x',
          type: 'linear',
          round: true,
          nice: true,
          domain: logFoldChangeDomain,
          range: 'width',
        },
        {
          name: 'y',
          type: 'linear',
          round: true,
          nice: true,
          zero: true,
          domain: maxNegativeLogpValueDomain,
          range: 'height',
        },
        {
          name: 'color',
          type: 'ordinal',
          range:
            [
              config.significantUpregulatedColor,
              config.significantDownregulatedColor,
              config.notSignificantUpregulatedColor,
              config.notSignificantDownregulatedColor,
              config.significantChangeDirectionUnknownColor,
              config.noDifferenceColor,
            ],
          domain: {
            data: 'differentialExpression',
            field: 'status',
            sort: true,
          },
        },

      ],

      axes: [
        {
          scale: 'x',
          grid: true,
          domain: true,
          orient: 'bottom',
          // tickCount: config.logFoldChangeTickCount
          //  || this.defaultConfig.logFoldChangeTickCount,
          title: 'log2 fold change',
          gridColor: { value: config.colGrid },
          gridOpacity: { value: (config.transGrid / 20) },
          gridWidth: { value: (config.widthGrid / 20) },
          offset: { value: config.axesOffset },
          titleFontSize: { value: config.axistitlesize },
          labelFontSize: { value: config.axisticks },
          domainWidth: { value: config.lineWidth },
        },
        {
          scale: 'y',
          grid: true,
          domain: true,
          orient: 'left',
          // tickCount: config.negativeLogpValueTickCount
          //  || this.defaultConfig.negativeLogpValueTickCount,
          titlePadding: 5,
          gridColor: { value: config.colGrid },
          gridOpacity: { value: (config.transGrid / 20) },
          gridWidth: { value: (config.widthGrid / 20) },
          offset: { value: config.axesOffset },
          title: '-log10(pvalue)',
          titleFontSize: { value: config.axistitlesize },
          labelFontSize: { value: config.axisticks },
          domainWidth: { value: config.lineWidth },

        },
      ],

      title:
      {
        text: { value: config.titleText },
        anchor: { value: config.titleAnchor },
        dx: 10,
        fontSize: { value: config.titleSize },
      },

      marks: [
        {
          type: 'symbol',

          from: { data: 'differentialExpression' },


          encode: {
            enter: {
              x: { scale: 'x', field: 'log2FoldChange' },
              y: { scale: 'y', field: 'neglogpvalue' },
              size: { value: config.pointsize },
              shape: { value: config.pointstyle },
              strokeWidth: { value: 1 },
              strokeOpacity: { value: config.strokeOpa },
              stroke: {
                scale: 'color',
                field: 'status',
              },
              fillOpacity: { value: config.pointOpa / 10 },
              fill: {
                scale: 'color',
                field: 'status',
              },
            },
          },
        },

        {
          type: 'rule',
          encode: {
            update: {
              x: {
                scale: 'x',
                value: config.logFoldChangeThreshold,
                round: true,
              },
              y: { value: 0 },
              y2: { field: { group: 'height' } },
              stroke: {
                value: logFoldChangeThresholdColor,
              },
              strokeWidth: {
                value: config.thresholdGuideWidth,
              },
            },
          },
        },
        {
          type: 'rule',
          encode: {
            update: {
              x: {
                scale: 'x',
                value: config.logFoldChangeThreshold * -1,
                round: true,
              },
              y: { value: 0 },
              y2: { field: { group: 'height' } },
              stroke: {
                value: logFoldChangeThresholdColor,
              },
              strokeWidth: {
                value: config.thresholdGuideWidth,
              },
            },
          },
        },
        {
          type: 'rule',
          encode: {
            update: {
              y: {
                scale: 'y',
                value: -(Math.log(config.pvalueThreshold) / Math.log(10)),
                round: true,
              },
              x: { value: 0 },
              x2: { field: { group: 'width' } },
              stroke: {
                value: pvalueThresholdColor,
              },
              strokeWidth: {
                value: config.thresholdGuideWidth,
              },
            },
          },
        },
      ],
      // legends: [
      //  {
      //    fill: 'color',
      //    title: 'Colour Schema',
      //    orient: 'top-left',
      //    padding: 10,
      // legendX: (config.width || this.defaultConfig.width) + 20,
      // legendX: 600,
      // encode: {
      // symbols: { "enter": { "fillOpacity": { "value": 0.5 } } },
      // labels: { "update": { "text": { "field": "value" } } }
      //  },

      //  ],
    };
  }

  // obj is a subset of what default config has and contains only the things we want change
  updatePlotWithChanges(obj) {
    this.setState((prevState) => {
      const newState = _.cloneDeep(prevState);

      _.merge(newState.config, obj);

      return newState;
    });
  }

  render() {
    const { config } = this.state;
    const data = { differentialExpression: this.generateData() };

    return (
      <>
        <Row>
          <Col>
            <div style={{ paddingTop: '12px', paddingBottom: '12px' }}>
              <PageHeader
                className='site-page-header'
                title='Edit collection'
                breadcrumb={{ routes: this.routes }}
                subTitle='Customize plots and tables in this collection'
              />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={16}>
            <Space direction='vertical' style={{ width: '100%' }}>
              <Collapse defaultActiveKey={['1']}>
                <Panel header='Preview' key='1'>
                  <center>
                    <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
                  </center>
                </Panel>
              </Collapse>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction='vertical' style={{ width: '100%' }}>
              <Collapse defaultActiveKey={['1']}>
                <Panel header='Main Schema' key='1'>
                  <Collapse defaultActiveKey={['1']}>
                    <Panel header='Plot Dimensions and Ranges' key='7'>
                      <SchemaDesign
                        config={config}
                        onUpdate={this.updatePlotWithChanges}
                      />
                    </Panel>

                  </Collapse>

                  <Collapse defaultActiveKey={['1']}>
                    <Panel header='Define and Edit Title' key='6'>
                      <TitleDesign
                        config={config}
                        onUpdate={this.updatePlotWithChanges}
                      />
                    </Panel>

                  </Collapse>
                  <Collapse defaultActiveKey={['1']}>
                    <Panel header='Data Thresholding' key='8'>
                      <ThresholdsGuidesEditor
                        config={config}
                        onUpdate={this.updatePlotWithChanges}
                      />
                    </Panel>
                  </Collapse>
                </Panel>

                <Panel header='Axes and Margins' key='3'>
                  <AxesDesign
                    config={config}
                    onUpdate={this.updatePlotWithChanges}
                  />
                </Panel>
                <Panel header='Markers' key='4'>
                  <PointDesign
                    config={config}
                    onUpdate={this.updatePlotWithChanges}
                  />
                </Panel>
                <Panel header='Colour Options' key='5'>
                  <MarkersEditor
                    config={config}
                    onUpdate={this.updatePlotWithChanges}
                  />
                </Panel>
              </Collapse>
            </Space>
          </Col>
        </Row>
      </>
    );
  }
}

export default PlotsAndTablesViewPage;
