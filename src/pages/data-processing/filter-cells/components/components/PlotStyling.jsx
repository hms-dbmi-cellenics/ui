import TitleDesign from '../../../../plots-and-tables/components/TitleDesign'
import FontDesign from '../../../../plots-and-tables/components/FontDesign'
import LegendEditor from '../../../../plots-and-tables/components/LegendEditor'
import React, { useState } from 'react';

import {
  Radio, Collapse, Form, Input,
  Slider
} from 'antd';
const {Panel} = Collapse;
const PlotStyling = (props) => {                
  const { config, onUpdate, setAxis } = props;

      return(
              <Collapse>
                <Panel header='Plot Styling' >
                  <Form.Item label='Legend'>
                    <LegendEditor 
                      defaultState = {true}  
                      config={config}
                      onUpdate={onUpdate}
                    />
                  </Form.Item>
                  <Collapse accordion>
                  <Panel header = "Axes">
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
                  <Panel header = "Title">
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