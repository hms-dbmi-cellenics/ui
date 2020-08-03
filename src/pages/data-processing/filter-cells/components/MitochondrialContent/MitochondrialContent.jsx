/* eslint-disable no-param-reassign */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React from 'react';
import {
  Collapse, Row, Col, List, Space, Switch,
  InputNumber, Form, Input, Select,
} from 'antd';
import _ from 'lodash';
import { Vega } from '../../../../../../node_modules/react-vega';
import plot1Pic from '../../../../../../static/media/plot1.png';
import plot2Pic from '../../../../../../static/media/plot2.png';

import plotData from './data2.json';

const { Panel } = Collapse;
const { Option } = Select;
class MitochondrialContent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      plotToDraw: true,
      data: plotData,
      legendEnabled: true,
      minCellSize: 1000,
      xAxisText: 'Fraction of mitochondrial reads',
      yAxisText: 'Fraction of cells',
      xAxisText2: 'Cell rank',
      yAxisText2: "#UMI's in cell",
      xDefaultTitle: 'Fraction of mitochondrial reads',
      yDefaultTitle: 'Fraction of cells',
      legendOrientation: 'top-right',
    };
  }

  generateData() {
    let { data } = this.state;
    data = _.cloneDeep(data);
    return data;
  }

  generateSpec() {
    const {
      legendEnabled, plotToDraw, legendOrientation, minCellSize,
      xAxisText, yAxisText, xAxisText2, yAxisText2,
    } = this.state;
    let legend = null;
    if (legendEnabled) {
      legend =[
        {
          fill: 'color',
          orient: legendOrientation,
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
                fill: { value: 'black' },
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
      legend = null;
    }
    if (plotToDraw) {
      return {
        "$schema": "https://vega.github.io/schema/vega/v5.json",
        "description": "An interactive histogram for visualizing a univariate distribution.",
        "width": 430,
        "height": 300,
        "padding": 5,

        "signals": [
          { "name": "binStep", "value": 0.05,
            "bind": {"input": "range", "min": 0.001, "max": 0.4, "step": 0.001} }
        ],

        "data": [
          {
            "name": "plotData",
          },
          {
            "name": "binned",
            "source": "plotData",
            "transform": [
              {
                "type": "bin", 
                "field": "fracMito",
                "extent": [0, 1],
                "step": {"signal": "binStep"},
                "nice": false
              },
              {
                "type": "aggregate",
                "key": "bin0",
                "groupby": ["bin0", "bin1"],
                "fields": ["bin0"],
                "ops": ["count"],
                "as": ["count"]
              },
              {
                "type": "formula",
                "as": "count",
                "expr": "datum.count/10000"
              },
              {
                type: 'formula',
                as: 'status',
                expr: "(datum.bin1 <= 0.1) ? 'Real' : 'Mitochondrial'",
              },              
            ]
          }
        ],

        "scales": [
          {
            "name": "xscale",
            "type": "linear",
            "range": "width",
            "domain": [0, 1]
          },
          {
            "name": "yscale",
            "type": "linear",
            "range": "height", "round": true,
            "domain": {"data": "binned", "field": "count"},
            "zero": true, "nice": true
          },
          {
            name: 'color',
            type: 'ordinal',
            range:
              [
                'blue', 'green',
              ],
            domain: {
              data: 'binned',
              field: 'status',
              sort: true,
            },
          },
        ],

        "axes": [
          {"orient": "bottom", "scale": "xscale", "zindex": 1,
            title: {value: xAxisText}

          },
          {"orient": "left", "scale": "yscale", "tickCount": 5, "zindex": 1,
            title: {value: yAxisText}
          }
        ],

        "marks": [
          {
            "type": "rect",
            "from": {"data": "binned"},
            "encode": {
              "update": {
                "x": {"scale": "xscale", "field": "bin0"},
                "x2": {"scale": "xscale", "field": "bin1",
                      "offset": {"signal": "binStep > 0.02 ? -0.5 : 0"}},
                "y": {"scale": "yscale", "field": "count"},
                "y2": {"scale": "yscale", "value": 0},
                fill: {
                  scale: 'color',
                  field: 'status',
                },
              },
              "hover": { "fill": {"value": "firebrick"} }
            }
          },
          {
            "type": "rect",
            "from": {"data": "plotData"},
            "encode": {
              "enter": {
                "x": {"scale": "xscale", "field": "datum.fracMito"},
                "width": {"value": 1},
                "y": {"value": 25, "offset": {"signal": "height"}},
                "height": {"value": 5},
                "fill": {"value": "steelblue"},
                "fillOpacity": {"value": 0.4},
                fill: {
                  scale: 'color',
                  field: 'status',
                },
              }
            }
          }
        ],
        legends: legend
  }
}
    return {
        "$schema": "https://vega.github.io/schema/vega/v5.json",
        "description": "An interactive histogram for visualizing a univariate distribution.",
        "width": 430,
        "height": 300,
        "padding": 5,

        "signals": [
          { "name": "binStep", "value": 0.1,
            "bind": {"input": "range", "min": 0.001, "max": 0.5, "step": 0.001} }
        ],

        "data": [
          {
            "name": "plotData",
          },
          {
            "name": "binned",
            "source": "plotData",
            "transform": [
              {
                "type": "bin", 
                "field": "cellSize",
                "extent": [0, 6],
                "step": {"signal": "binStep"},
                "nice": false
              },
              {
                "type": "aggregate",
                "key": "bin0",
                "groupby": ["bin0", "bin1"],
                "fields": ["bin0"],
                "ops": ["count"],
                "as": ["count"]
              }             
            ]
          }
        ],

        "scales": [
          {
            "name": "xscale",
            "type": "linear",
            "range": "width",
            "domain": [0, 6]
          },
          {
            "name": "yscale",
            "type": "linear",
            "range": "height", "round": true,
            "domain": {"data": "binned", "field": "count"},
            "zero": true, "nice": true
          },
          {
            name: 'color',
            type: 'ordinal',
            range:
              [
                'green', 'blue',
              ],
            domain: {
              data: 'plotData',
              field: 'status',
              sort: true,
            },
          },
        ],

        "axes": [
          {"orient": "bottom", "scale": "xscale", "zindex": 1,
            title: {value: xAxisText}

          },
          {"orient": "left", "scale": "yscale", "tickCount": 5, "zindex": 1,
            title: {value: yAxisText}
          }
        ],

        "marks": [
          {
            "type": "rect",
            "from": {"data": "binned"},
            "encode": {
              "update": {
                "x": {"scale": "xscale", "field": "bin0"},
                "x2": {"scale": "xscale", "field": "bin1",
                      "offset": {"signal": "binStep > 0.02 ? -0.5 : 0"}},
                "y": {"scale": "yscale", "field": "count"},
                "y2": {"scale": "yscale", "value": 0},
                fill: {
                  scale: 'color',
                  field: 'status',
                },
              },
              "hover": { "fill": {"value": "firebrick"} }
            }
          },
        ],
        legends: legend
  }
  }

  render() {
    const data = { plotData: this.generateData() };
    const {
      plotToDraw, xAxisText, xAxisText2, yAxisText2, yAxisText,
      xDefaultTitle, yDefaultTitle,
    } = this.state;
    // eslint-disable-next-line react/prop-types
    const { filtering } = this.props;

    const changePlot = (val) => {
      this.setState({ plotToDraw: val });
      if (!plotToDraw) {
        this.setState({
          xDefaultTitle: xAxisText,
          yDefaultTitle: yAxisText,
        });
      } else {
        this.setState({
          xDefaultTitle: xAxisText2,
          yDefaultTitle: yAxisText2,
        });
      }
    };
    const setAxis = (val, axe) => {
      if (axe === 'x') {
        if (plotToDraw) {
          this.setState({ xAxisText: val.target.value });
        } else {
          this.setState({ xAxisText2: val.target.value });
        }
      }
      if (axe === 'y') {
        if (plotToDraw) {
          this.setState({ yAxisText: val.target.value });
        } else {
          this.setState({ yAxisText2: val.target.value });
        }
      }
    };
    const MethodChange = (val) => {
      console.log(val);
    };
    return (
      <>
        <Row>

          <Col span={13}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>

          <Col span={4}>
            <Space direction='vertical'>
              <img
                alt=''
                src={plot1Pic}
                style={{
                  height: '100px', width: '100px', align: 'center', padding: '8px',
                }}
                onClick={() => changePlot(true)}
              />
              <img
                alt=''
                src={plot2Pic}
                style={{
                  height: '100px', width: '100px', align: 'center', padding: '8px',
                }}
                onClick={() => changePlot(false)}
              />
            </Space>
          </Col>


          <Col span={7}>
            <Space direction='vertical'>
              <Collapse>
                <Panel header='Filtering settings' disabled={!filtering}>
                  Method:
                  <Space direction='vertical'>
                    <Select
                      defaultValue='option1'
                      style={{ width: 200 }}
                      onChange={(val) => MethodChange(val)}
                      disabled={!filtering}
                    >
                      <Option value='option1'>option1</Option>
                      <Option value='option2'>option2</Option>
                      <Option value='option3'>option3</Option>
                    </Select>
                    <Space>
                      Max fraction:
                      <InputNumber disabled={!filtering} defaultValue={0} />
                    </Space>
                  </Space>
                </Panel>

                <Panel header='Plot Styling' disabled={!filtering}>
                  <Form.Item label='Toggle Legend'>
                    <Switch
                      defaultChecked
                      disabled={!filtering}
                      onChange={(val) => this.setState({ legendEnabled: val })}
                    />
                  </Form.Item>
                  <Form.Item
                    label='X axis Title'
                  >
                    <Input
                      placeholder={xDefaultTitle}
                      onPressEnter={(val) => setAxis(val, 'x')}

                      disabled={!filtering}
                    />
                  </Form.Item>
                  <Form.Item
                    label='Y axis Title'
                  >
                    <Input
                      placeholder={yDefaultTitle}
                      onPressEnter={(val) => setAxis(val, 'y')}
                      disabled={!filtering}
                    />
                  </Form.Item>
                </Panel>
              </Collapse>
            </Space>
          </Col>
        </Row>
      </>
    );
  }
}

export default MitochondrialContent;
