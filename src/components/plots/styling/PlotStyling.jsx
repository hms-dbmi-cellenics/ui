/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import {
  Collapse,
} from 'antd';
import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import TitleDesign from './TitleDesign';
import FontDesign from './FontDesign';
import LegendEditor from './LegendEditor';
import LabelsDesign from './LabelsDesign';
import DimensionsRangeEditor from './DimensionsRangeEditor';
import AxesDesign from './AxesDesign';
import AxesWithRangesDesign from './AxesWithRangesDesign';
import PointDesign from './PointDesign';
import ColourbarDesign from './ColourbarDesign';
import ColourInversion from './ColourInversion';
import ExpressionValuesType from './ExpressionValuesType';
import ExpressionValuesCapping from './ExpressionValuesCapping';

import ViolinMarkersEditor from './violin/MarkersEditor';

import VolcanoThresholdsGuidesEditor from './volcano/ThresholdsGuidesEditor';
import VolcanoMarkersEditor from './volcano/MarkersEditor';
import VolcanoDisplayLabels from './volcano/DisplayLabels';

const { Panel } = Collapse;

const PlotStyling = (props) => {
  const {
    formConfig, config, onUpdate, extraPanels, defaultActiveKey,
  } = props;

  const ComponentMapping = {
    dimensions: (attr) => <DimensionsRangeEditor key='dimensions' config={config} onUpdate={onUpdate} {...attr} />,
    title: (attr) => <TitleDesign key='title' config={config} onUpdate={onUpdate} {...attr} />,
    font: (attr) => <FontDesign key='font' config={config} onUpdate={onUpdate} {...attr} />,
    axes: (attr) => <AxesDesign key='axes' config={config} onUpdate={onUpdate} {...attr} />,
    axesWithRanges: (attr) => <AxesWithRangesDesign key='axesWithRanges' config={config} onUpdate={onUpdate} {...attr} />,
    colourScheme: (attr) => <ColourbarDesign key='colourScheme' config={config} onUpdate={onUpdate} {...attr} />,
    colourInversion: (attr) => <ColourInversion key='colourInversion' config={config} onUpdate={onUpdate} {...attr} />,
    expressionValuesType: (attr) => <ExpressionValuesType key='expressionValuesType' config={config} onUpdate={onUpdate} {...attr} />,
    expressionValuesCapping: (attr) => <ExpressionValuesCapping key='expressionValuesCapping' config={config} onUpdate={onUpdate} {...attr} />,
    markers: (attr) => <PointDesign key='markers' config={config} onUpdate={onUpdate} {...attr} />,
    legend: (attr) => <LegendEditor key='legend' onUpdate={onUpdate} config={config} {...attr} />,
    labels: (attr) => <LabelsDesign key='legend' onUpdate={onUpdate} config={config} {...attr} />,
    violinMarkers: (attr) => <ViolinMarkersEditor key='violinMarkers' config={config} onUpdate={onUpdate} {...attr} />,
    volcanoThresholds: (attr) => <VolcanoThresholdsGuidesEditor key='volcanoThresholds' config={config} onUpdate={onUpdate} {...attr} />,
    volcanoMarkers: (attr) => <VolcanoMarkersEditor key='volcanoMarkers' config={config} onUpdate={onUpdate} {...attr} />,
    volcanoLabels: (attr) => <VolcanoDisplayLabels key='volcanoLabels' config={config} onUpdate={onUpdate} {...attr} />,
  };

  const formatPanelKey = (key) => key.trim().toLowerCase().replace(' ', '-');

  const buildForm = (configObj) => configObj.map((el) => {
    // Build component object from component

    if (Object.getOwnPropertyDescriptor(el, 'controls') && el.controls.length > 0) {
      return (
        <Panel header={el.panelTitle} key={formatPanelKey(el.panelTitle)}>
          {el.header}
          {el.controls.map((control) => {
            // If control is a string, no prop is passed
            if (_.isString(control)) {
              return ComponentMapping[control]({});
            }

            return ComponentMapping[control.name](control.props || {});
          })}

          {
            Object.getOwnPropertyDescriptor(el, 'children')
              && el.children.length > 0
              ? (
                <Collapse>
                  {buildForm(el.children)}
                </Collapse>
              )
              : ''
          }

          {el.footer}
        </Panel>
      );
    }
    return <></>;
  });

  return (
    <Collapse defaultActiveKey={defaultActiveKey} accordion>
      {extraPanels}
      {buildForm(formConfig)}
    </Collapse>
  );
};

PlotStyling.propTypes = {
  formConfig: PropTypes.array,
  config: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  extraPanels: PropTypes.node,
  defaultActiveKey: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
  ]),
};

PlotStyling.defaultProps = {
  formConfig: [],
  config: {},
  extraPanels: null,
  defaultActiveKey: [],
};

export default PlotStyling;
