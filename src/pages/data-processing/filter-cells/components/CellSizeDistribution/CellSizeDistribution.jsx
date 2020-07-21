import { Vega } from '../../../../../../node_modules/react-vega';
import React from 'react';
import {
  Collapse, Row, Col, List, Space, Switch,
  InputNumber
} from 'antd';
import plot1Pic from '../../../../../../static/media/plot1.png'
import plotData from './data.json'
const { Panel } = Collapse;

class CellSizeDistribution extends React.Component {
  //constructor(props){
  // }
  constructor(props) {
    super(props);
  }
  state = {
    plotToDraw: true,
    filtering: false,
    data: plotData,
  }
  generateSpec() {

    return {
      "$schema": "https://vega.github.io/schema/vega/v5.json",
      "description": "An interactive histogram for visualizing a univariate distribution.",
      "width": 480,
      "height": 300,
      "padding": 5,

      "signals": [
        {
          "name": "binOffset", "value": 0,
          "bind": { "input": "range", "min": 1000, "max": 20000 }
        },
        {
          "name": "binStep", "value": 0.1,
          "bind": { "input": "range", "min": 1, "max": 400, "step": 1 }
        }
      ],

      "data": [
        {
          "name": "points",
          //"values": [{ "u": 8890.246597269077 }, { "u": 7986.663750139649 }, { "u": 9301.510440766624 }, { "u": 9282.633699156811 }, { "u": 6555.373101949364 }, { "u": 10514.968034838901 }, { "u": 7106.7743148814625 }, { "u": 7504.875250542309 }, { "u": 6190.0626860116445 }, { "u": 5697.884671567523 }, { "u": 12214.277172534195 }, { "u": 9117.803880095329 }, { "u": 9455.47341614528 }, { "u": 6350.5139684546675 }, { "u": 7232.703585796234 }, { "u": 5321.734526816241 }, { "u": 9767.699076937095 }, { "u": 6058.336378817098 }, { "u": 8406.868540671869 }, { "u": 6386.603935952411 }, { "u": 8715.000769354307 }, { "u": 6381.629262055603 }, { "u": 10496.455222127537 }, { "u": 5853.814578407296 }, { "u": 4756.350648929394 }, { "u": 2322.109239247976 }, { "u": 5859.80253529055 }, { "u": 10106.381904647164 }, { "u": 7395.2208088089465 }, { "u": 7538.46601792463 }, { "u": 10113.176753811505 }, { "u": 10569.268900020928 }, { "u": 7800.815504079701 }, { "u": 7101.617860266876 }, { "u": 6589.257541873888 }, { "u": 7181.218874010514 }, { "u": 5178.656749871328 }, { "u": 10420.519686697216 }, { "u": 6757.311416133681 }, { "u": 5273.714255745703 }, { "u": 8341.58890513402 }, { "u": 6431.902358816627 }, { "u": 6058.77290300025 }, { "u": 8341.008313317714 }, { "u": 8261.29477657383 }, { "u": 7792.089152328877 }, { "u": 9268.798532386902 }, { "u": 6528.472852121428 }, { "u": 8565.418068031187 }, { "u": 10348.876780429044 }, { "u": 6956.428642049301 }, { "u": 5516.266656047489 }, { "u": 7885.426386670262 }, { "u": 7153.39418161835 }, { "u": 4307.723848771246 }, { "u": 10377.863546688252 }, { "u": 10324.378651800484 }, { "u": 6839.4744048181565 }, { "u": 6218.956573075674 }, { "u": 7012.786147818334 }, { "u": 7790.2887383771495 }, { "u": 7100.077421777519 }, { "u": 5204.826616966671 }, { "u": 7682.317177205755 }, { "u": 7251.640292144306 }, { "u": 8974.64594851847 }, { "u": 9257.148884594004 }, { "u": 3273.49141258901 }, { "u": 7064.318712386963 }, { "u": 5454.3559329323525 }, { "u": 5680.671924317181 }, { "u": 7446.039008200692 }, { "u": 6835.814012124578 }, { "u": 4602.431429003676 }, { "u": 8777.955600368601 }, { "u": 8463.8110596901 }, { "u": 5475.784475955354 }, { "u": 10825.719900765931 }, { "u": 7154.504552180961 }, { "u": 7924.966012266565 }, { "u": 8786.199126176823 }, { "u": 12040.919354310146 }, { "u": 8489.049061092242 }, { "u": 8367.94997963691 }, { "u": 4609.76634739713 }, { "u": 6774.731440137771 }, { "u": 8675.621277236301 }]
          'values': plotData
        },
        {
          "name": "binned",
          "source": "points",
          "transform": [
            {
              "type": "bin", "field": "u",
              "extent": [1000, 20000],
              "anchor": { "signal": "binOffset" },
              "step": { "signal": "binStep" },
              "nice": false
            },
            {
              "type": "aggregate",
              "key": "bin0", "groupby": ["bin0", "bin1"],
              "fields": ["bin0"], "ops": ["count"], "as": ["count"]
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
        }
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
            "update": {
              "x": { "scale": "xscale", "field": "bin0" },
              "x2": {
                "scale": "xscale", "field": "bin1",
                "offset": { "signal": "binStep > 0.02 ? -0.5 : 0" }
              },
              "y": { "scale": "yscale", "field": "count" },
              "y2": { "scale": "yscale", "value": 0 },
              "fill": { "value": "steelblue" }
            },
            "hover": { "fill": { "value": "firebrick" } }
          }
        },
        {
          "type": "rect",
          "from": { "data": "points" },
          "encode": {
            "enter": {
              "x": { "scale": "xscale", "field": "u" },
              "width": { "value": 1 },
              "y": { "value": 25, "offset": { "signal": "height" } },
              "height": { "value": 5 },
              "fill": { "value": "steelblue" },
              "fillOpacity": { "value": 0.4 }
            }
          }
        }
      ]
    }



  };
  generateData() {
    const { data } = this.state;

    return data;
  }
  render() {
    const data = { plotData: this.generateData() };
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
      console.log(this.state.filtering)

    }
    return (
      <>
        <Row>

          <Col span={12}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>

          <Col span={6}>
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