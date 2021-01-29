import React from 'react';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';

import plotData from './fake_new_data.json';

const ElbowPlot = (props) => {
  const { plotConfig } = props;

  const generateSpec = () => ({
    width: plotConfig.width,
    height: plotConfig.height,
    autosize: { type: 'fit', resize: true },
    padding: 5,

    signals: [
      {
        name: 'interpolate',
        value: 'linear',
        bind: {
          input: 'select',
          options: [
            'basis',
            'cardinal',
            'catmull-rom',
            'linear',
            'monotone',
            'natural',
            'step',
            'step-after',
            'step-before',
          ],
        },
      },
    ],

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
        title: { value: plotConfig.xAxisText },
        titleFont: { value: plotConfig.masterFont },
        labelFont: { value: plotConfig.masterFont },
        titleFontSize: { value: plotConfig.axisTitlesize },
        labelFontSize: { value: plotConfig.axisTicks },
        offset: { value: plotConfig.axisOffset },
        gridOpacity: { value: (plotConfig.transGrid / 20) },
      },
      {
        orient: 'left',
        scale: 'y',
        grid: true,
        format: '%',
        zindex: 1,
        title: { value: plotConfig.yAxisText },
        titleFont: { value: plotConfig.masterFont },
        labelFont: { value: plotConfig.masterFont },
        titleFontSize: { value: plotConfig.axisTitlesize },
        labelFontSize: { value: plotConfig.axisTicks },
        offset: { value: plotConfig.axisOffset },
        gridOpacity: { value: (plotConfig.transGrid / 20) },
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
            x: { scale: 'x', value: plotConfig.minProbability, round: true },
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
      text: { value: plotConfig.titleText },
      anchor: { value: plotConfig.titleAnchor },
      font: { value: plotConfig.masterFont },
      dx: 10,
      fontSize: { value: plotConfig.titleSize },
    },
  });

  return <Vega data={{ plotData }} spec={generateSpec()} renderer='canvas' />;
};

ElbowPlot.defaultProps = {
};

ElbowPlot.propTypes = {
  plotConfig: PropTypes.object.isRequired,
};

export default ElbowPlot;
