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

const { Panel } = Collapse;
const PlotStyling = (props) => {
  const {
    formConfig, config, onUpdate, onChange,
  } = props;

  const ComponentMapping = {
    dimensions: (attr) => <DimensionsRangeEditor config={config} onUpdate={onUpdate} {...attr} />,
    title: (attr) => <TitleDesign config={config} onUpdate={onUpdate} {...attr} />,
    font: (attr) => <FontDesign config={config} onUpdate={onUpdate} {...attr} />,
    axes: (attr) => <AxesDesign config={config} onUpdate={onUpdate} {...attr} />,
    colourbar: (attr) => <ColourbarDesign config={config} onUpdate={onUpdate} {...attr} />,
    colourInversion: (attr) => <ColourInversion config={config} onUpdate={onUpdate} {...attr} />,
    marker: (attr) => <PointDesign config={config} onUpdate={onUpdate} {...attr} />,
    legend: (attr) => <LegendEditor onUpdate={onUpdate} config={config} {...attr} />,
  };

  const buildForm = (configObj) => configObj.map((el) => {
    // Build component object from component

    if (Object.getOwnPropertyDescriptor(el, 'controls') && el.controls.length > 0) {
      return (
        <Collapse accordion>
          <Panel header={el.panelTitle} keys={el.panelTitle}>
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
                ? buildForm(el.children)
                : ''
            }
          </Panel>
        </Collapse>
      );
    }
  });

  return (
    <>
      {
        buildForm(formConfig)
      }
    </>
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
