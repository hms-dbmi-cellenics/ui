import { Vega } from '../../../../../../node_modules/react-vega';
import React from 'react';
import {
  Collapse, Row, Col, List, Space, Switch, Select,
  InputNumber,
} from 'antd';
import plot1Pic from '../../../../../../static/media/plot1.png'
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
  }
  generateSpec() {

    return {
      "$schema": "https://vega.github.io/schema/vega/v5.json",
      "description": "A histogram of film ratings, modified to include null values.",
      "width": 400,
      "height": 300,
      "padding": 5,
      "autosize": { "type": "fit", "resize": true },

      "signals": [

        {
          "name": "binCount",
          "update": "(bins.stop - bins.start) / bins.step"
        },
        {
          "name": "nullGap", "value": 10
        },
        {
          "name": "barStep",
          "update": "(width - nullGap) / (1 + binCount)"
        }
      ],

      "data": [
        {
          "name": "plotData",
          "transform": [
            {
              "type": "extent", "field": "IMDB_Rating",
              "signal": "extent"
            },
            {
              "type": "bin", "signal": "bins",
              "field": "IMDB_Rating", "extent": { "signal": "extent" },
            }
          ]
        },
        {
          "name": "counts",
          "source": "plotData",
          "transform": [
            {
              "type": "filter",
              "expr": "datum['IMDB_Rating'] != null"
            },
            {
              "type": "aggregate",
              "groupby": ["bin0", "bin1"]
            }
          ]
        },
        {
          "name": "nulls",
          "source": "plotData",
          "transform": [
            {
              "type": "filter",
              "expr": "datum['IMDB_Rating'] == null"
            },
            {
              "type": "aggregate"
            }
          ]
        }
      ],

      "scales": [
        {
          "name": "yscale",
          "type": "linear",
          "range": "height",
          "round": true, "nice": true,
          "domain": {
            "fields": [
              { "data": "counts", "field": "count" },
              { "data": "nulls", "field": "count" }
            ]
          }
        },
        {
          "name": "xscale",
          "type": "linear",
          "range": [{ "signal": "barStep + nullGap" }, { "signal": "width" }],
          "round": true,
          "domain": { "signal": "[bins.start, bins.stop]" },
          "bins": { "signal": "bins" }
        },
        {
          "name": "xscale-null",
          "type": "band",
          "range": [0, { "signal": "barStep" }],
          "round": true,
          "domain": [null]
        }
      ],

      "axes": [
        { "orient": "bottom", "scale": "xscale", "tickMinStep": 0.5 },
        { "orient": "bottom", "scale": "xscale-null" },
        { "orient": "left", "scale": "yscale", "tickCount": 5, "offset": 5 }
      ],

      "marks": [
        {
          "type": "rect",
          "from": { "data": "counts" },
          "encode": {
            "update": {
              "x": { "scale": "xscale", "field": "bin0", "offset": 1 },
              "x2": { "scale": "xscale", "field": "bin1" },
              "y": { "scale": "yscale", "field": "count" },
              "y2": { "scale": "yscale", "value": 0 },
              "fill": { "value": "steelblue" }
            },
            "hover": {
              "fill": { "value": "firebrick" }
            }
          }
        },
        {
          "type": "rect",
          "from": { "data": "nulls" },
          "encode": {
            "update": {
              "x": { "scale": "xscale-null", "value": null, "offset": 1 },
              "x2": { "scale": "xscale-null", "band": 1 },
              "y": { "scale": "yscale", "field": "count" },
              "y2": { "scale": "yscale", "value": 0 },
              "fill": { "value": "#aaa" }
            },
            "hover": {
              "fill": { "value": "firebrick" }
            }
          }
        }
      ]
    };
  };
  render() {
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
    const handleChange = () => {

    }
    return (
      <>
        <Row>

          <Col span={9}>
            <Vega spec={this.generateSpec()} renderer='canvas' />
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


          <Col span={8}>
            <Space direction='vertical'>
              <Space>
                <Switch defaultChecked onChange={disableFiltering} />
                Disable controls
              </Space>
              <Collapse >
                <Panel header="filtering settings" disabled={this.state.filtering}>
                  Method:
                  <Space direction='vertical'>
                    <Select defaultValue="option1" style={{ width: 200 }}
                      onChange={handleChange} disabled={this.state.filtering}>
                      <Option value="option1">option1</Option>
                      <Option value="option2">option2</Option>
                      <Option value="option3">option3</Option>
                    </Select>
                    <Space>
                      Max fraction:
                  <InputNumber disabled={this.state.filtering} defaultValue={0} />
                    </Space>
                  </Space>
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