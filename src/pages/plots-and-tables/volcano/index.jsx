import React, { useEffect } from 'react';
import {
  Row, Col, Space, Collapse, Slider, Skeleton,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import differentialExpression from './differential_expression.json';
import ThresholdsGuidesEditor from './components/ThresholdsGuidesEditor';
import MarkersEditor from './components/MarkersEditor';
import PointDesign from '../components/PointDesign';
import TitleDesign from '../components/TitleDesign';
import DimensionsRangeEditorVolcano from './components/DimensionsRangeEditorVolcano';
import AxesDesign from '../components/AxesDesign';
import FontDesign from '../components/FontDesign';
import ColourInversion from '../components/ColourInversion';
import LegendEditor from '../components/LegendEditor';
import { updatePlotConfig, loadPlotConfig } from '../../../redux/actions/plots/index';
import Header from '../components/Header';

const { Panel } = Collapse;
const routes = [
  {
    path: 'index',
    breadcrumbName: 'Experiments',
  },
  {
    path: 'first',
    breadcrumbName: '10x PBMC 3k',
  },
  {
    path: 'second',
    breadcrumbName: 'Plots and tables',
  },
  {
    path: 'third',
    breadcrumbName: 'Volcano plot',
  },
];

const plotUuid = 'volcanoPlotMain';
const plotType = 'volcano';

const VolcanoPlot = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.plots[plotUuid]?.config);
  const experimentId = '5e959f9c9f4b120771249001';

  useEffect(() => {
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, []);

  let maxNegativeLogpValue = 0;
  let l2fcMin = null;
  let l2fcMax = null;
  let xMax = null;

  const generateData = () => {
    const data = differentialExpression.filter((datum) => {
      // Downsample insignificant, not changing genes by the appropriate amount.
      const isSignificant = (
        datum.log2fc < config.logFoldChangeThreshold * -1
        || datum.log2fc > config.logFoldChangeThreshold)
        && datum.qval < config.pvalueThreshold;

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
      if (datum.qval <= config.pvalueThreshold
        && datum.log2fc >= config.logFoldChangeThreshold) {
        status = '1_significantUpregulated';
      } else if (datum.qval <= config.pvalueThreshold
        && datum.log2fc <= config.logFoldChangeThreshold * -1) {
        status = '2_significantDownregulated';
      } else if (datum.qval > config.pvalueThreshold
        && datum.log2fc >= config.logFoldChangeThreshold) {
        status = '3_notSignificantUpregulated';
      } else if (datum.qval > config.pvalueThreshold
        && datum.log2fc <= config.logFoldChangeThreshold * -1) {
        status = '4_notSignificantDownregulated';
      } else if (datum.qval <= config.pvalueThreshold
        && datum.log2fc > config.logFoldChangeThreshold * -1
        && datum.log2fc < config.logFoldChangeThreshold) {
        status = '5_significantChangeDirectionUnknown';
      } else {
        status = '6_noDifference';
      }
      // eslint-disable-next-line no-param-reassign
      datum.status = status;

      return datum;
    });

    return data;
  };

  const generateSpec = () => {
    differentialExpression.forEach((o) => {
      Object.keys(o).forEach((k) => {
        if (k === 'pvalue' && o[k] !== 'NA' && o[k] !== 0) {
          maxNegativeLogpValue = Math.max(
            maxNegativeLogpValue, -Math.log10(o[k]),
          );
        }
      });
    });

    differentialExpression.forEach((o) => {
      Object.keys(o).forEach((k) => {
        if (k === 'log2fc' && o[k] !== 'NA' && o[k] !== 1 && o[k] !== 0) {
          l2fcMin = Math.min(l2fcMin, o[k]);
          l2fcMax = Math.max(l2fcMax, o[k]);
        }
      });
    });

    if (Math.abs(l2fcMin) > Math.abs(l2fcMax)) {
      xMax = Math.abs(l2fcMin);
    } else {
      xMax = Math.abs(l2fcMax);
    }
    const logFoldChangeFilterExpr = (config.logFoldChangeDomain)
      ? `datum.log2fc > ${config.logFoldChangeDomain * -1} && datum.log2fc < ${config.logFoldChangeDomain}`
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
      : { data: 'differentialExpression', field: 'log2fc' };

    const maxNegativeLogpValueDomain = config.maxNegativeLogpValueDomain
      ? [0, config.maxNegativeLogpValueDomain]
      : { data: 'differentialExpression', field: 'neglogpvalue' };

    const x = (config.textThresholdValue);

    const textThreshold = ` ${x}`;
    const textEquation = `datum.log2fc !== 'NA' && datum.neglogpvalue >${textThreshold}`;

    return {
      $schema: 'https://vega.github.io/schema/vega/v5.json',
      description: 'A basic scatter plot example depicting automobile statistics.',
      width: config.width,
      height: config.height,
      background: config.toggleInvert,
      padding: 5,
      data: [
        {
          name: 'differentialExpression',
          transform: [
            {
              type: 'filter',
              expr: "datum.log2fc !== 'NA' && datum.qval !== 'NA'",
            },

            {

              type: 'formula',
              as: 'neglogpvalue',

              expr: '-(log(datum.qval) / LN10)',
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
              expr: textEquation,

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
              x: { scale: 'x', field: 'log2fc' },
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
              x: { scale: 'x', field: 'log2fc' },
              y: { scale: 'y', field: 'neglogpvalue' },

              fill: { value: config.masterColour },
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
  };

  // obj is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  maxNegativeLogpValue = 6;

  if (!config) {
    return (<Skeleton />);
  }

  return (
    <>
      <Header plotUuid={plotUuid} experimentId={experimentId} routes={routes} />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                <center>
                  <Vega data={{ differentialExpression: generateData() }} spec={generateSpec()} renderer='canvas' />
                </center>
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']} accordion>
              <Panel header='Main Schema' key='1'>
                <DimensionsRangeEditorVolcano
                  config={config}
                  onUpdate={updatePlotWithChanges}
                  xMax={Math.round(xMax)}
                  yMax={Math.round(maxNegativeLogpValue) + 2}
                />
                <Collapse defaultActiveKey={['1']} accordion>
                  <Panel header='Define and Edit Title' key='6'>
                    <TitleDesign
                      config={config}
                      onUpdate={updatePlotWithChanges}
                    />
                  </Panel>
                  <Panel header='Font' key='9'>
                    <FontDesign
                      config={config}
                      onUpdate={updatePlotWithChanges}
                    />
                  </Panel>
                </Collapse>
              </Panel>
              <Panel header='Data Thresholding' key='8'>
                <ThresholdsGuidesEditor
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
              </Panel>
              <Panel header='Axes and Margins' key='3'>
                <AxesDesign
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
              </Panel>
              <Panel header='Colours' key='10'>
                <MarkersEditor
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
                <ColourInversion
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
              </Panel>
              <Panel header='Markers' key='4'>
                <PointDesign
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
              </Panel>
              <Panel header='Text' key='11'>
                <> Display Gene Labels Above (-log10 pvalue) </>
                <Slider
                  defaultValue={config.textThresholdValue}
                  min={0}
                  max={maxNegativeLogpValue + 5}
                  onChange={(val) => updatePlotWithChanges({ textThresholdValue: val })}
                />
              </Panel>
              <Panel header='Legend' key='12'>
                <LegendEditor
                  onUpdate={updatePlotWithChanges}
                  legendConfig={[
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
                  ]}
                />
              </Panel>
            </Collapse>
          </Space>
        </Col>
      </Row>
    </>
  );
};

export default VolcanoPlot;
