import { Vega } from '../../../../../../node_modules/react-vega';
import React from 'react';
import {
  Collapse, Row, Col, List, Space, Switch,
  InputNumber
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
    console.log("****** ", data);
    //this.setState({ data });
    return data;
  }
  generateSpec() {
    console.log(plotData.status)
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
      "$schema": "https://vega.github.io/schema/vega/v5.json",
      "description": "An interactive histogram for visualizing a univariate distribution.",
      "width": 480,
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
              "extent": [1000, 20000],
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
          "domain": [1000, 14000]
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
        { "orient": "bottom", "scale": "xscale", "zindex": 1 },
        { "orient": "left", "scale": "yscale", "tickCount": 5, "zindex": 1 }
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
              "y": { "value": 25, "offset": { "signal": "height" } },
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
    //const newData = this.generateData();

    const listData = [
      'Estimated number of cells  ',
      'Fraction reads in cells  ',
      'Mean reads per cell  ',
      'Median genes per cell  ',
      'Total genes detected   ',
      'Median UMI counts per cell   ',
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
      this.setState({
        filtering: !this.state.filtering,
      });
    }

    return (
      <>
        <Row>

          <Col span={13}>
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
              // onMouseOver={e => (e.currentTarget.style={{height: '110px', width: '110px'}})}

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
                Disable controls
          </Space>
              <Collapse >
                <Panel header="filtering settings" disabled={this.state.filtering}>
                  Min cell size:
                  <InputNumber disabled={this.state.filtering} defaultValue={1000} />
                </Panel>

                <Panel header="plot styling" disabled={this.state.filtering}>
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


