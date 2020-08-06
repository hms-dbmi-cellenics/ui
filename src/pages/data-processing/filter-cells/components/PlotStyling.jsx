/* eslint-disable react/prop-types */
import {
  Collapse, Form, Input,
  Slider,
} from 'antd';
import React from 'react';

import TitleDesign from '../../../plots-and-tables/components/TitleDesign';
import FontDesign from '../../../plots-and-tables/components/FontDesign';
import LegendEditor from '../../../plots-and-tables/components/LegendEditor';


const { Panel } = Collapse;
const PlotStyling = (props) => {
  const { config, onUpdate, singlePlot } = props;
  const setAxis = (val, axe) => {
    if (axe === 'x') {
      if (config.plotToDraw || singlePlot) {
        onUpdate({ xAxisText: val.target.value });
      } else {
        onUpdate({ xAxisText2: val.target.value });
      }
    }
    if (axe === 'y') {
      if (config.plotToDraw || singlePlot) {
        onUpdate({ yAxisText: val.target.value });
      } else {
        onUpdate({ yAxisText2: val.target.value });
      }
    }
  };
  return (
    <Collapse>
      <Panel header='Plot Styling'>
        <Form.Item label='Legend'>
          <LegendEditor
            defaultState
            config={config}
            onUpdate={onUpdate}
          />
        </Form.Item>
        <Collapse accordion>
          <Panel header='Axes'>
            <Form.Item
              label='X axis Title'
            >
              <Input
                placeholder={config.xDefaultTitle}
                onPressEnter={(val) => setAxis(val, 'x')}
              />
            </Form.Item>
            <Form.Item
              label='Y axis Title'
            >
              <Input
                placeholder={config.yDefaultTitle}
                onPressEnter={(val) => setAxis(val, 'y')}
              />
            </Form.Item>
          </Panel>
          <Panel header='Title'>
            <TitleDesign
              config={config}
              onUpdate={onUpdate}
            />
          </Panel>
          <Panel header='Font' key='9'>
            <FontDesign
              config={config}
              onUpdate={onUpdate}
            />
            Font size
            <Slider
              defaultValue={13}
              min={5}
              max={21}
              onAfterChange={(value) => {
                onUpdate({ masterSize: value });
              }}
            />
          </Panel>
        </Collapse>
      </Panel>
    </Collapse>
  );
};
export default PlotStyling;
