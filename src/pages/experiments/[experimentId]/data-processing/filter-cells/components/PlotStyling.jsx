/* eslint-disable react/prop-types */
import {
  Collapse, Form, Input,
  Slider,
} from 'antd';
import React from 'react';

import TitleDesign from '../../../plots-and-tables/components/TitleDesign';
import FontDesign from '../../../plots-and-tables/components/FontDesign';
import LegendEditor from '../../../plots-and-tables/components/LegendEditor';
import DimensionsRangeEditor from '../../../plots-and-tables/components/DimensionsRangeEditor';

const { Panel } = Collapse;
const PlotStyling = (props) => {
  const {
    config, onUpdate, singlePlot, legendMenu,
  } = props;
  //  legendMenu is true if the plot has a legend
  //  singlePlot is true if there is only one plot in the dropdown

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
  let legend;
  if (legendMenu) {
    legend = (
      <Panel header='Legend'>
        <LegendEditor
          legendEnabled={config.legendEnabled}
          onUpdate={onUpdate}
          legendOptions='corners'
          legendPosition={config.legendPosition}
        />
      </Panel>
    );
  } else {
    legend = null;
  }
  return (
    <Collapse>
      <Panel header='Plot Styling'>
        <Collapse accordion>
          {legend}
          <Panel header='Plot Dimensions'>
            <DimensionsRangeEditor
              config={config}
              onUpdate={onUpdate}
              maxHeight={config.maxHeight}
              maxWidth={config.maxWidth}
            />
          </Panel>
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
            <Form.Item
              label='Axes Label Size'
            >
              <Slider
                defaultValue={config.axisTitlesize}
                min={5}
                max={21}
                onAfterChange={(value) => {
                  onUpdate({ axisTitlesize: value });
                }}
              />
            </Form.Item>

            <Form.Item
              label='Axes Ticks Size'
            >
              <Slider
                defaultValue={config.axisTicks}
                min={5}
                max={21}
                onAfterChange={(value) => {
                  onUpdate({ axisTicks: value });
                }}
              />
            </Form.Item>

            <Form.Item
              label='Offset Margins'
            >
              <Slider
                defaultValue={config.axisOffset}
                min={0}
                max={20}
                onAfterChange={(value) => {
                  onUpdate({ axisOffset: value });
                }}
              />
            </Form.Item>

            <Form.Item
              label='Grid-line weight'
            >
              <Slider
                defaultValue={config.transGrid}
                min={0}
                max={10}
                onAfterChange={(value) => {
                  onUpdate({ transGrid: value });
                }}
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
          </Panel>
        </Collapse>
      </Panel>
    </Collapse>
  );
};
export default PlotStyling;
