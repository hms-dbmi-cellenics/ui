import { Vega } from '../../../../../../node_modules/react-vega';
import React from 'react';
import {
  PageHeader, Collapse, Button, Row, Col, Table,List, Typography, Space
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';

import plotData from './data.json'
const { Panel } = Collapse;

class CellSizeDistribution extends React.Component {
  //constructor(props){
 // }
 constructor(props){
  super(props);

 }
  generateSpec(){

  return{
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "description": "A histogram of film ratings, modified to include null values.",
    "width": 300,
    "height": 200,
    "padding": 5,
    "autosize": { "type": "fit", "resize": true },

    "signals": [
      {
        "name": "maxbins", "value": 10,
        "bind": { "input": "select", "options": [5, 10, 20] }
      },
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
            "maxbins": { "signal": "maxbins" }
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
render(){
  const listData = [
  'Estimated number of cells  ',
  'Fraction reads in cells  ',
  'Mean reads per cell  ',
  'Median genes per cell  ',
  'Total genes detected   ',
  'Median UMI counts per cell   ',
  ];

  return (
    <>
    <Row>
      <Col span = {8}>
      <Vega data={plotData} spec={this.generateSpec()} renderer='canvas' />   
      </Col>
      <Space>
        <Col span={2}>

      <Button
        icon={<CloseOutlined />}
      />
      <Button
        icon={<CloseOutlined />}
      />
     </Col>
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
      </Space>

      <Col span = {8}>
      <Collapse>
        <Panel header = "filtering settings">
        </Panel>
        
        <Panel header = "plot styling">
        </Panel>
      </Collapse>
      </Col>
          </Row>
    </>
  );
}
}

export default CellSizeDistribution