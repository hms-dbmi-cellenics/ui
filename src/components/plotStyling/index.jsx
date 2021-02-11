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
import DimensionsRangeEditor from './DimensionsRangeEditor';
import AxesDesign from './AxesDesign';
import PointDesign from './PointDesign';
import ColourbarDesign from './ColourbarDesign';
import ColourInversion from './ColourInversion';

import VolcanoDimensionsRangeEditor from './VolcanoDimensionsRangeEditor';
import VolcanoThresholdsGuidesEditor from './VolcanoThresholdsGuidesEditor';
import VolcanoMarkersEditor from './VolcanoMarkersEditor';

const { Panel } = Collapse;
const PlotStyling = (props) => {
  const {
    formConfig, config, onUpdate,
  } = props;

  const ComponentMapping = {
    dimensions: (attr) => <DimensionsRangeEditor key='dimensions' config={config} onUpdate={onUpdate} {...attr} />,
    title: (attr) => <TitleDesign key='title' config={config} onUpdate={onUpdate} {...attr} />,
    font: (attr) => <FontDesign key='font' config={config} onUpdate={onUpdate} {...attr} />,
    axes: (attr) => <AxesDesign key='axes' config={config} onUpdate={onUpdate} {...attr} />,
    colourbar: (attr) => <ColourbarDesign key='colourbar' config={config} onUpdate={onUpdate} {...attr} />,
    colourInversion: (attr) => <ColourInversion key='colourInversion' config={config} onUpdate={onUpdate} {...attr} />,
    markers: (attr) => <PointDesign key='markers' config={config} onUpdate={onUpdate} {...attr} />,
    legend: (attr) => <LegendEditor key='legend' onUpdate={onUpdate} config={config} {...attr} />,
    volcanoDimensions: (attr) => <VolcanoDimensionsRangeEditor key='volcanoDimensions' config={config} onUpdate={onUpdate} {...attr} />,
    volcanoThresholds: (attr) => <VolcanoThresholdsGuidesEditor key='volcanoThresholds' config={config} onUpdate={onUpdate} {...attr} />,
    volcanoMarkers: (attr) => <VolcanoMarkersEditor key='volcanoMarkers' config={config} onUpdate={onUpdate} {...attr} />,
  };

  const buildForm = (configObj) => configObj.map((el) => {
    // Build component object from component

    if (Object.getOwnPropertyDescriptor(el, 'controls') && el.controls.length > 0) {
      return (
        <Panel header={el.panelTitle} key={el.panelTitle}>
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
                <Collapse accordion>
                  { buildForm(el.children)}
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
    <Collapse accordion style={{ marginTop: '-9px' }}>
      {
        console.log(buildForm(formConfig))
      }
      {
        buildForm(formConfig)
      }
    </Collapse>
  );
};

PlotStyling.propTypes = {
  formConfig: PropTypes.array,
  config: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  onChange: PropTypes.func,
};

PlotStyling.defaultProps = {
  formConfig: [],
  config: {},
  onChange: null,
};

export default PlotStyling;
