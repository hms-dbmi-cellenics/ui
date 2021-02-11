/* eslint-disable react/prop-types */
import {
  Collapse,
} from 'antd';
import React from 'react';
import PropTypes from 'prop-types';

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
    formConfig, config, onUpdate,
  } = props;

  const ComponentMapping = {
    dimensions: <DimensionsRangeEditor config={config} onUpdate={onUpdate} />,
    title: <TitleDesign config={config} onUpdate={onUpdate} />,
    font: <FontDesign config={config} onUpdate={onUpdate} />,
    axes: <AxesDesign config={config} onUpdate={onUpdate} />,
    colourbar: <ColourbarDesign config={config} onUpdate={onUpdate} />,
    colourInversion: <ColourInversion config={config} onUpdate={onUpdate} />,
    marker: <PointDesign config={config} onUpdate={onUpdate} />,
    legend: <LegendEditor onUpdate={onUpdate} config={config} />,
  };

  const buildForm = (configObj) => configObj.map((el) => {
    // Build component object from component

    if (Object.getOwnPropertyDescriptor(el, 'form') && el.form.length > 0) {
      return (
        <Collapse accordion>
          <Panel header={el.panel} key={el.panel}>
            {el.form.map((component) => ComponentMapping[component])}
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

    // if (Object.getOwnPropertyDescriptor(configObj, 'children')) {
    //   buildForm(el.children);
    // }
  });

  return (
    <>
      {
        console.log(buildForm(formConfig))
      }

      {
        buildForm(formConfig)
      }
    </>
  );
};

PlotStyling.propTypes = {
  components: PropTypes.array,
  config: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  onChange: PropTypes.func,
};

PlotStyling.defaultProps = {
  components: [],
  config: {},
  onChange: null,
};

export default PlotStyling;
