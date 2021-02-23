import React from 'react';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';

const ElbowPlot = (props) => {
  const {
    stylingConfig, calculationConfig, plotData, actions,
  } = props;

  const redLineXValue = calculationConfig.dimensionalityReduction.numPCs;

  const generateSpec = () => ({
    width: stylingConfig.dimensions.width,
    height: stylingConfig.dimensions.height,
    autosize: { type: 'fit', resize: true },
    padding: 5,

    signals: stylingConfig.signals,

    data: [
      {
        name: 'plotData',
        transform: [
          {
            type: 'formula',
            as: 'percent',
            expr: 'datum.percentVariance',
          },
        ],
      },
    ],

    scales: [
      {
        name: 'x',
        type: 'linear',
        range: 'width',
        domain: { data: 'plotData', field: 'PC' },
      },
      {
        name: 'y',
        type: 'linear',
        range: 'height',
        nice: true,
        zero: true,
        domain: { data: 'plotData', field: 'percent' },
      },
    ],

    axes: [
      {
        orient: 'bottom',
        scale: 'x',
        grid: true,
        tickCount: 15,
        zindex: 1,
        title: { value: stylingConfig.axes.xAxisText },
        titleFont: { value: stylingConfig.axes.titleFont },
        labelFont: { value: stylingConfig.axes.labelFont },
        titleFontSize: { value: stylingConfig.axes.titleFontSize },
        labelFontSize: { value: stylingConfig.axes.labelFontSize },
        offset: { value: stylingConfig.axes.offset },
        gridOpacity: { value: (stylingConfig.axes.gridOpacity / 20) },
      },
      {
        orient: 'left',
        scale: 'y',
        grid: true,
        tickCount: 15,
        format: '%',
        zindex: 1,
        title: { value: stylingConfig.axes.yAxisText },
        titleFont: { value: stylingConfig.axes.titleFont },
        labelFont: { value: stylingConfig.axes.labelFont },
        titleFontSize: { value: stylingConfig.axes.titleFontSize },
        labelFontSize: { value: stylingConfig.axes.labelFontSize },
        offset: { value: stylingConfig.axes.offset },
        gridOpacity: { value: (stylingConfig.axes.gridOpacity / 20) },
      },
    ],

    marks: [
      {
        type: 'line',
        from: { data: 'plotData' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'PC' },
            y: { scale: 'y', field: 'percent' },
            strokeWidth: { value: 2 },
          },
          update: {
            interpolate: { signal: 'interpolate' },
            strokeOpacity: { value: 1 },
          },
          hover: {
            strokeOpacity: { value: 0.5 },
          },
        },
      },
      {
        type: 'rule',
        encode: {
          update: {
            x: { scale: 'x', value: redLineXValue, round: true },
            y: { value: 0 },
            y2: { field: { group: 'height' } },
            strokeWidth: { value: 2 },
            strokeDash: { value: [8, 4] },
            stroke: { value: 'red' },
          },
        },
      },
    ],
    title:
    {
      text: { value: stylingConfig.title.text },
      anchor: { value: stylingConfig.title.anchor },
      font: { value: stylingConfig.title.font },
      fontSize: { value: stylingConfig.title.fontSize },
      dx: { value: stylingConfig.title.dx },
    },
  });

  return <Vega data={{ plotData }} spec={generateSpec()} renderer='canvas' actions={actions} />;
};

ElbowPlot.defaultProps = {
};

ElbowPlot.propTypes = {
  stylingConfig: PropTypes.object.isRequired,
  calculationConfig: PropTypes.object.isRequired,
  plotData: PropTypes.array.isRequired,
  actions: PropTypes.bool.isRequired,
};

export default ElbowPlot;
