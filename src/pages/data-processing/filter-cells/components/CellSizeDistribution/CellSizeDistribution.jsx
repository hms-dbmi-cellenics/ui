import { Vega } from '../../../../../../node_modules/react-vega';
import React from 'react';
import {
  Collapse, Row, Col, List, Space, Switch,
  InputNumber, Form, Input
} from 'antd';
import _ from 'lodash'
import plot1Pic from '../../../../../../static/media/plot1.png'
import plotData from './new_data.json'
const { Panel } = Collapse;

class CellSizeDistribution extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      plotToDraw: true,
      filtering: false,
      data: plotData,
      legendEnabled: true,
      legend: null,
      minCellSize: 1000,
      minCellSizeChanged: 0,
      xAxisText: "#UMIs in cell",
      yAxisText: "#UMIs * #Cells",
    }
  }

  generateData() {
    let { data } = this.state;
    data = _.cloneDeep(data);

    data = data.map((datum) => {
      let status;

      if (datum.u <= 8800) {
        status = 'low';
      } else if (datum.u >= 10800) {
        status = 'high';
      }
      else {
        status = 'unknown';
      }
      datum.status = status;

      return datum;
    });
    return data;
  }
  generateSpec() {
    if (this.state.legendEnabled) {
      this.state.legend = [
        {
          fill: 'color',
          orient: 'top-left',
          title: 'Quality',
          encode: {
            title: {
              update: {
                fontSize: { value: 14 },
              }
            },
            labels: {
              interactive: true,
              update: {
                fontSize: { value: 12 },
                fill: { value: "black" },
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
    }
    else {
      this.state.legend = null;
    }
    return {
      "description": "An interactive histogram",
      "width": 470,
      "height": 300,
      "padding": 5,

      "signals": [
        {
          "name": "binStep", "value": 200,
          "bind": { "input": "range", "min": 100, "max": 400, "step": 1 }
        }
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
              "type": "bin", "field": "u",
              "extent": [this.state.minCellSize, 17000],
              "step": { "signal": "binStep" },
              "nice": false
            },
            {
              "type": "aggregate",
              "key": "bin0", "groupby": ["bin0", "bin1"],
              "fields": ["bin0"], "ops": ["count"], "as": ["count"]
            },

            {
              "type": "formula",
              "as": "status",
              "expr": "(datum.bin1 < 8800) ? 'low' : (datum.bin1 > 10800) ? 'high' : 'unknown'"
            }
          ]
        }
      ],

      "scales": [
        {
          "name": "xscale",
          "type": "linear",
          "range": "width",
          "domain": [1000, 17000]
        },
        {
          "name": "yscale",
          "type": "linear",
          "range": "height", "round": true,
          "domain": { "data": "binned", "field": "count" },
          "zero": true, "nice": true
        },
        {
          'name': 'color',
          'type': 'ordinal',
          'range':
            [
              'green', '#f57b42', 'grey'
            ],
          'domain': {
            'data': 'plotData',
            'field': 'status',
            'sort': true,
          },
        },
      ],
      "axes": [
        {
          "orient": "bottom", "scale": "xscale", "zindex": 1,
          title: { value: this.state.xAxisText },
        },
        {
          "orient": "left", "scale": "yscale", "tickCount": 5, "zindex": 1,
          title: { value: this.state.yAxisText },
        }
      ],

      "marks": [
        {
          "type": "rect",
          "from": { "data": "binned" },
          "encode": {
            "enter": {
              "x": { "scale": "xscale", "field": "bin0" },
              "x2": {
                "scale": "xscale", "field": "bin1",
                "offset": { "signal": "binStep > 0.02 ? -0.5 : 0" }
              },
              "y": { "scale": "yscale", "field": "count" },
              "y2": { "scale": "yscale", "value": 0 },
              'stroke': { "value": "black" },
              'strokeWidth': { 'value': 0.5 },
              'fill': {
                'scale': 'color',
                'field': 'status',
              },
            },

          }
        },
        {
          "type": "rect",
          "from": { "data": "plotData" },
          "encode": {
            "enter": {
              "x": { "scale": "xscale", "field": "u" },
              "width": { "value": 1 },
              "y": { "value": 35, "offset": { "signal": "height" } },
              "height": { "value": 5 },
              'stroke': {
                'scale': 'color',
                'field': 'status',
              },
              'fill': {
                'scale': 'color',
                'field': 'status',
              },
              "fillOpacity": { "value": 0.4 }
            }
          }
        }
      ],
      legends: this.state.legend
    }



  };

  render() {
    const data = { plotData: this.generateData() };

    const listData = [
      'Estimated number of cells 8672',
      'Fraction reads in cells  93.1%',
      'Mean reads per cell  93,551',
      'Median genes per cell  1,297',
      'Total genes detected   21,425',
      'Median UMI counts per cell   4,064',
    ];
    const imageClick = (image) => {
      if (image) {
        this.setState({
          plotToDraw: true,
        });
      }
      else {
        this.setState({
          plotToDraw: false,
        });
      }
    }
    const disableFiltering = (checked) => {
      const currentCell = this.state.minCellSize
      const changedCell = this.state.minCellSizeChanged
      this.setState({
        filtering: !this.state.filtering,
      });
      if (!this.state.filtering) {
        this.setState({
          minCellSizeChanged: currentCell,
          minCellSize: 1000
        })
      }
      else {
        this.setState({
          minCellSize: changedCell,
        })
      }
    }

    return (
      <>
        <Row>

          <Col span={12}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>

          <Col span={5}>
            <Space direction="vertical">
              <img
                src={plot1Pic}
                style={{
                  height: '100px', width: '100px', align: 'center', padding: '8px',
                }}
                onClick={() => imageClick(true)}
              />
              <img
                src={plot1Pic}
                style={{
                  height: '100px', width: '100px', align: 'center', padding: '8px',
                }}
                onClick={() => imageClick(false)}
              />
            </Space>
            <List
              bordered
              dataSource={listData}
              size={"small"}
              renderItem={item => (
                <List.Item>
                  {item}
                </List.Item>
              )}
            />
          </Col>


          <Col span={6}>
            <Space direction='vertical'>
              <Space>
                <Switch defaultChecked onChange={disableFiltering} />
                Disable Filter
          </Space>
              <Collapse >
                <Panel header="Filtering Settings" disabled={this.state.filtering}>
                  Min cell size:
                  <InputNumber disabled={this.state.filtering}
                    defaultValue={1000} onChange={(val) => this.setState({ minCellSize: val })} />
                </Panel>

                <Panel header="Plot Styling" disabled={this.state.filtering}>
                  <Form.Item label="Toggle Legend">
                    <Switch defaultChecked disabled={this.state.filtering}
                      onChange={(val) => this.setState({ legendEnabled: val })} />
                  </Form.Item>
                  <Form.Item
                    label='X axis Title'
                  >
                    <Input
                      placeholder='Enter X axis title'
                      onPressEnter={(val) => this.setState({ xAxisText: val.target.value })}
                      disabled={this.state.filtering}
                    />
                  </Form.Item>
                  <Form.Item
                    label='X axis Title'
                  >
                    <Input
                      placeholder='Enter Y axis title'
                      onPressEnter={(val) => this.setState({ yAxisText: val.target.value })}
                      disabled={this.state.filtering}
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

export default CellSizeDistribution


