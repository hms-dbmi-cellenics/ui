import React from 'react';

import {
  PageHeader, Row, Col, Space, Collapse,
} from 'antd';

import { Vega } from 'react-vega';

import _ from 'lodash';
import differentialExpression from './differential_expression.json';

import ThresholdsGuidesEditor from './components/ThresholdsGuidesEditor';
import MarkersEditor from './components/MarkersEditor';
import PointDesign from './components/PointDesign';
import TitleDesign from './components/TitleDesign';

import SchemaDesign from './components/SchemaDesign';
import AxesDesign from './components/AxesDesign';
import FontDesign from './components/FontDesign';
import ColourInversion from './components/ColourInversion';
import LegendEditor from '../components/LegendEditor';

const { Panel } = Collapse;

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

      pointSize: 32,
      pointStyle: 'circle',
      pointOpa: 5,
      strokeOpa: 1,
      strokeCol: '#000000',
      legend: null,
      legendEnabled: null,
      axisTitlesize: 13,
      axisTicks: 13,
      colGrid: '#000000',
      widthGrid: 10,
      transGrid: 5,
      axesOffset: 10,
      lineWidth: 2,
      xaxisText: 'Log2 Fold Change',
      yaxisText: 'Log10 -p-value',

      titleText: '',
      titleSize: 20,
      titleAnchor: 'start',

      masterFont: 'sans-serif',
      masterColour: '#000000',
      toggleInvert: '#FFFFFF',
      reverseCbar: false,
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

    if (config.toggleInvert === '#000000') {
      config.reverseCbar = true;
      config.masterColour = '#FFFFFF';
    }
    if (config.toggleInvert === '#FFFFFF') {
      config.reverseCbar = false;
      config.masterColour = '#000000';
    }
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
    if (config.legendEnabled) {
      config.legend = [
        {
          fill: 'color',
          encode: {
            title: {
              update: {
                fontSize: { value: 14 },
              },
            },
            labels: {
              interactive: true,
              update: {
                fontSize: { value: 12 },
                fill: { value: config.masterColour },
              },
              hover: {
                fill: { value: 'firebrick' },
              },
            },
            symbols: {
              update: {
                stroke: { value: 'transparent' },
              },
            },
            legend: {
              update: {
                stroke: { value: '#ccc' },
                strokeWidth: { value: 1.5 },
              },
            },
          },
        },
      ];
    } else {
      config.legend = null;
    }

    return {
      $schema: 'https://vega.github.io/schema/vega/v5.json',
      description: 'A basic scatter plot example depicting automobile statistics.',
      width: config.width || this.defaultConfig.width,
      height: config.height || this.defaultConfig.height,
      background: config.toggleInvert,
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
              // suggest not use natural log here, and use either LOG2E or LOG10E
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
        {
          name: 'dex2',
          source: 'differentialExpression',
          transform: [
            {
              type: 'filter',
              expr: "datum.log2FoldChange !== 'NA' && datum.pvalue < 1e-11",
            }],
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
            reverse: config.reverseCbar,

          },
        },

      ],

      axes: [
        {
          scale: 'x',
          grid: true,
          domain: true,
          orient: 'bottom',
          title: { value: config.xaxisText },
          titleFont: { value: config.masterFont },
          labelFont: { value: config.masterFont },
          labelColor: { value: config.masterColour },
          tickColor: { value: config.masterColour },
          gridColor: { value: config.masterColour },
          gridOpacity: { value: (config.transGrid / 20) },
          gridWidth: { value: (config.widthGrid / 20) },
          offset: { value: config.axesOffset },
          titleFontSize: { value: config.axisTitlesize },
          titleColor: { value: config.masterColour },
          labelFontSize: { value: config.axisTicks },
          domainWidth: { value: config.lineWidth },
        },
        {
          scale: 'y',
          grid: true,
          domain: true,
          orient: 'left',
          titlePadding: 5,
          gridColor: { value: config.masterColour },
          gridOpacity: { value: (config.transGrid / 20) },
          gridWidth: { value: (config.widthGrid / 20) },
          tickColor: { value: config.masterColour },
          offset: { value: config.axesOffset },
          title: { value: config.yaxisText },
          titleFont: { value: config.masterFont },
          labelFont: { value: config.masterFont },
          labelColor: { value: config.masterColour },
          titleFontSize: { value: config.axisTitlesize },
          titleColor: { value: config.masterColour },
          labelFontSize: { value: config.axisTicks },
          domainWidth: { value: config.lineWidth },

        },
      ],

      title:
      {
        text: { value: config.titleText },
        color: { value: config.masterColour },
        anchor: { value: config.titleAnchor },
        font: { value: config.masterFont },
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
              size: { value: config.pointSize },
              shape: { value: config.pointStyle },
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
          type: 'text',
          from: { data: 'dex2' },
          encode: {
            enter: {
              x: { scale: 'x', field: 'log2FoldChange' },
              y: { scale: 'y', field: 'neglogpvalue' },
              fill: { value: '#000' },
              text: { field: 'Rownames' },
            },
            transform: [
              { type: 'label', size: ['width', 'height'] }],
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
      legends: config.legend,
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
                  <Collapse>
                    <Panel header='Font' key='9'>
                      <FontDesign
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
                <Panel header='Colours' key='10'>
                  <Collapse>
                    <Panel header='Colour Options' key='5'>
                      <MarkersEditor
                        config={config}
                        onUpdate={this.updatePlotWithChanges}
                      />
                    </Panel>
                  </Collapse>
                  <ColourInversion
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


                <Panel header='Legend' key='11'>
                  <LegendEditor
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
