import React, { useEffect, useState } from 'react';
import {
  Row, Col, Space, Collapse, Slider, Skeleton, Spin,
} from 'antd';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import ThresholdsGuidesEditor from './components/ThresholdsGuidesEditor';
import MarkersEditor from './components/MarkersEditor';
import PointDesign from '../components/PointDesign';
import TitleDesign from '../components/TitleDesign';
import DimensionsRangeEditorVolcano from './components/DimensionsRangeEditorVolcano';
import AxesDesign from '../components/AxesDesign';
import FontDesign from '../components/FontDesign';
import ColourInversion from '../components/ColourInversion';
import LegendEditor from '../components/LegendEditor';
import generateSpec from '../../../utils/plotSpecs/generateVolcanoSpec';
import Header from '../components/Header';
import DiffExprCompute from '../../experiments/[experimentId]/data-exploration/components/differential-expression-tool/DiffExprCompute';
import isBrowser from '../../../utils/environment';
import { updatePlotConfig, loadPlotConfig } from '../../../redux/actions/plots/index';
import loadDifferentialExpression from '../../../redux/actions/loadDifferentialExpression';
import renderError from '../utils/renderError';

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
  const loading = useSelector((state) => state.differentialExpression.properties.loading);
  const differentialExpression = useSelector(
    (state) => state.differentialExpression.properties.data,
  );
  const error = useSelector((state) => state.differentialExpression.properties.error);
  const experimentId = '5e959f9c9f4b120771249001';

  const [plotData, setPlotData] = useState([]);
  const [spec, setSpec] = useState({ spec: null, maxNegativeLogpValue: null, xMax: null });

  useEffect(() => {
    if (!isBrowser) return;

    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, []);

  useEffect(() => {
    if (!config) return;
    if (_.isEmpty(config.diffExpData)) return;

    dispatch(loadDifferentialExpression(experimentId, config.diffExpData));
  }, [config?.diffExpData]);

  useEffect(() => {
    if (!config) return;

    const generatedSpec = generateSpec(config, plotData);
    setSpec(generatedSpec);
  }, [config]);

  useEffect(() => {
    if (differentialExpression.length === 0) return;

    setPlotData(generateData(differentialExpression));
  }, [differentialExpression]);

  useEffect(() => {
    if (plotData.length === 0) return;

    const generatedSpec = generateSpec(config, plotData);
    setSpec(generatedSpec);
  }, [plotData]);


  const generateData = (data) => {
    const result = data.filter((datum) => {
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

      const pvalueThreshold = (10 ** (-1 * config.negLogpValueThreshold)).toExponential(3);

      if (datum.qval <= pvalueThreshold
        && datum.log2fc >= config.logFoldChangeThreshold) {
        status = '1_significantUpregulated';
      } else if (datum.qval <= pvalueThreshold
        && datum.log2fc <= config.logFoldChangeThreshold * -1) {
        status = '2_significantDownregulated';
      } else if (datum.qval > pvalueThreshold
        && datum.log2fc >= config.logFoldChangeThreshold) {
        status = '3_notSignificantUpregulated';
      } else if (datum.qval > pvalueThreshold
        && datum.log2fc <= config.logFoldChangeThreshold * -1) {
        status = '4_notSignificantDownregulated';
      } else if (datum.qval <= pvalueThreshold
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

<<<<<<< HEAD
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

    const x = (config.textThresholdValue);

    const textThreshold = ` ${x}`;
    const textEquation = `datum.log2FoldChange !== 'NA' && datum.neglogpvalue >${textThreshold}`;

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
  }
=======
    return result;
  };
>>>>>>> master

  // obj is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const onComputeDiffExp = (diffExpData) => {
    updatePlotWithChanges({
      diffExpData,

      // These reset the ranges to `null`, which makes them automatically
      // determined by the algorithm. Because of our bad DE, we have issues
      // where we have extreme values, so this is not necessary right now.
      // TODO: fix this when we have good DE

      // maxNegativeLogpValueDomain: null,
      // logFoldChangeDomain: null,
    });
  };

  if (!config) {
    return (<Skeleton />);
  }

  const renderPlot = () => {
    if (error) {
      return renderError('Could not load differential expression data.', () => {
        dispatch(loadDifferentialExpression(experimentId, config.diffExpData));
      });
    }

    if (plotData.length === 0 || loading || _.isEmpty(spec.spec)) {
      return <Spin />;
    }

    console.error(plotData);

    return <Vega data={{ data: plotData }} spec={spec.spec} renderer='canvas' />;
  };

  return (
    <>
      <Header plotUuid={plotUuid} experimentId={experimentId} routes={routes} />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                <center>
                  {renderPlot()}
                </center>
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']} accordion>
              <Panel header='Differential Expression' key='15'>
                <DiffExprCompute
                  experimentId={experimentId}
                  onCompute={onComputeDiffExp}
                  cellSets={config.diffExpData}
                />
              </Panel>
              <Panel header='Main Schema' key='1'>
                <DimensionsRangeEditorVolcano
                  config={config}
                  onUpdate={updatePlotWithChanges}
                  xMax={Math.round(spec.xMax)}
                  yMax={Math.round(spec.maxNegativeLogpValue) + 2}
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
                  max={spec.maxNegativeLogpValue + 5}
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
