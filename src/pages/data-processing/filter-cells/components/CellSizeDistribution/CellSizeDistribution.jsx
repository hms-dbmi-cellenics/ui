/* eslint-disable no-param-reassign */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React from 'react';
import {
  Collapse, Row, Col, List, Space, Switch,
  InputNumber, Form, Input,
} from 'antd';
import _ from 'lodash';
import { Vega } from '../../../../../../node_modules/react-vega';
import plot1Pic from '../../../../../../static/media/plot1.png';
import plot2Pic from '../../../../../../static/media/plot2.png';

import plotData from './new_data.json';


const { Panel } = Collapse;

class CellSizeDistribution extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      plotToDraw: true,
      data: plotData,
      legendEnabled: true,
      minCellSize: 1000,
      xAxisText: '#UMIs in cell',
      yAxisText: '#UMIs * #Cells',
      xAxisText2: 'Cell rank',
      yAxisText2: "#UMI's in cell",
      xDefaultTitle: '#UMIs in cell',
      yDefaultTitle: '#UMIs * #Cells',
      legendOrientation: 'right',
    };
  }

  generateData() {
    let { data } = this.state;
    data = _.cloneDeep(data);

    data = data.map((datum) => {
      let newStatus;

      if (datum.u <= 8800) {
        newStatus = 'low';
      } else if (datum.u >= 10800) {
        newStatus = 'high';
      } else {
        newStatus = 'unknown';
      }
      datum.status = newStatus;

      return datum;
    });
    return data;
  }

  generateSpec() {
    const {
      legendEnabled, plotToDraw, legendOrientation, minCellSize,
      xAxisText, yAxisText, xAxisText2, yAxisText2,
    } = this.state;
    let legend = null;
    if (legendEnabled) {
      legend = [
        {
          fill: 'color',
          orient: legendOrientation,
          title: 'Quality',
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
        description: 'An interactive histogram',
        width: 430,
        height: 300,
        padding: 5,

        signals: [
          {
            name: 'binStep',
            value: 200,
            bind: {
              input: 'range', min: 100, max: 400, step: 1,
            },
          },
        ],
        data: [
          {
            name: 'plotData',
          },
          {
            name: 'binned',
            source: 'plotData',
            transform: [
              {
                type: 'bin',
                field: 'u',
                extent: [minCellSize, 17000],
                step: { signal: 'binStep' },
                nice: false,
              },
              {
                type: 'aggregate',
                key: 'bin0',
                groupby: ['bin0', 'bin1'],
                fields: ['bin0'],
                ops: ['count'],
                as: ['count'],
              },

              {
                type: 'formula',
                as: 'status',
                expr: "(datum.bin1 < 8800) ? 'low' : (datum.bin1 > 10800) ? 'high' : 'unknown'",
              },
            ],
          },
        ],

        scales: [
          {
            name: 'xscale',
            type: 'linear',
            range: 'width',
            domain: [1000, 17000],
          },
          {
            name: 'yscale',
            type: 'linear',
            range: 'height',
            round: true,
            domain: { data: 'binned', field: 'count' },
            zero: true,
            nice: true,
          },
          {
            name: 'color',
            type: 'ordinal',
            range:
              [
                'green', '#f57b42', 'grey',
              ],
            domain: {
              data: 'plotData',
              field: 'status',
              sort: true,
            },
          },
        ],
        axes: [
          {
            orient: 'bottom',
            scale: 'xscale',
            zindex: 1,
            title: { value: xAxisText },
          },
          {
            orient: 'left',
            scale: 'yscale',
            zindex: 1,
            title: { value: yAxisText },
          },
        ],
        marks: [
          {
            type: 'rect',
            from: { data: 'binned' },
            encode: {
              enter: {
                x: { scale: 'xscale', field: 'bin0' },
                x2: {
                  scale: 'xscale',
                  field: 'bin1',
                  offset: { signal: 'binStep > 0.02 ? -0.5 : 0' },
                },
                y: { scale: 'yscale', field: 'count' },
                y2: { scale: 'yscale', value: 0 },
                stroke: { value: 'black' },
                strokeWidth: { value: 0.5 },
                fill: {
                  scale: 'color',
                  field: 'status',
                },
              },

            },
          },
          {
            type: 'rect',
            from: { data: 'plotData' },
            encode: {
              enter: {
                x: { scale: 'xscale', field: 'u' },
                width: { value: 1 },
                y: { value: 35, offset: { signal: 'height' } },
                height: { value: 5 },
                stroke: {
                  scale: 'color',
                  field: 'status',
                },
                fill: {
                  scale: 'color',
                  field: 'status',
                },
                fillOpacity: { value: 0.4 },
              },
            },
          },
        ],
        legends: legend,
      };
    }
    return {
      description: 'Cell rank chart',
      width: 430,
      height: 300,
      padding: 5,

      data: [
        {
          name: 'plotData2',
          // eslint-disable-next-line max-len
          values: [8890.246597269077, 6409.0827815223265, 5262.568057878455, 8175.856434263419, 6498.095551479318, 6452.198291350293, 7903.081817283769, 8508.080449416404, 3374.436049834374, 5656.852499709955, 8727.851368501608, 6641.468077572576, 5293.700569003389, 3713.8307410168277, 6619.459831123543, 7844.485954413146, 7575.6020080062535, 9846.91495304661, 8510.382821887164, 8547.940666788561, 10961.400396290377, 10726.91364288143, 10401.00763726163, 7446.957936861351, 9499.976846764417, 11525.743154323573, 8374.29878623275, 5628.893397220147, 5755.223588777479, 7788.598155046685, 8930.59866444764, 2960.2421011092574, 7677.733193202549, 11170.723105943016, 7786.790544826358, 7271.038850655245, 5340.785411314336, 8991.136862237128, 7572.31241454849, 9351.126383880179, 7147.965974074182, 7758.412420268236, 10111.39769141666, 5848.150783959889, 8340.955557017494, 4019.487654397327, 6916.56835451427, 6321.961788532082, 6628.850118969595, 8479.180890834052, 7566.303173622124, 7484.743428350514, 9883.267053602178, 5883.947886377284, 6171.018779717876, 5489.365133136173, 6125.04135784361, 9961.91871403487, 7840.5099162174065, 6865.632869905486, 3696.5686816156754, 7839.061535204972, 7265.42702916191, 8356.58543997936, 7370.087946345297, 7357.212425657274, 6045.938891935662, 8238.508082218676, 7517.808541852215, 8312.224632953024, 5917.40700906548, 5399.071542116866, 9589.550656411342, 5887.628585047093, 7715.516797505545, 7570.253950823893, 9373.08406093409, 6517.378965711483, 5114.990851691708, 2433.1575901646283, 5629.833068949935, 7438.636457335948, 7307.217570881931, 4547.573039737976, 8095.597945298262, 7308.505917605862, 3381.001978459878, 8664.589709092434, 10199.237997029046, 9257.080409677643, 7718.917435976934, 10132.11908823053, 8067.399016006338, 6007.5077936367, 3109.0810063836598, 7238.737613737362, 6156.831155903355, 6253.795431888923, 8161.185250268715, 8799.590573119418, 6209.496887479841, 6991.886104583215, 9364.511343480877, 4619.801133103394, 6149.294410417226, 6494.196827826752, 9796.676568488001, 6572.348483379874, 10122.204771684355, 7875.502116740919, 4660.775106901518, 12799.196822095459, 8846.971726618815, 8055.249874634308, 9467.067007218857, 10155.035164571153, 7911.879727514152, 8194.154854182289, 6020.919317381122, 6577.873354617806, 9692.69905605182, 5896.3173867619535, 4164.381784768765, 6461.741698924494, 7666.94977663955, 5058.043461605972, 7208.485085143507, 10307.561861396196, 11101.782402340968, 9621.267375507803, 4893.732728225754, 10197.351100976754, 6632.710665829025, 9719.93839034965, 4353.592435529015, 7285.885940731175, 7325.71452609243, 7953.790958870259, 9359.642292507837, 10807.990289855676, 9794.200875119277, 7794.687649308413, 6301.531089678787, 8021.265992652746, 5094.183632498664, 7140.682490005281, 7475.474785296165, 2800.13889480383, 5253.485566628266, 8468.404941695448, 5318.164602370087, 9869.446215470993, 3244.256464423899, 4561.473303656076, 6009.504013959213, 9351.218537382878, 9851.943556487706, 7765.799806821214, 8692.25266609879, 7054.090823082271, 10018.085091504314, 6087.934904260921, 6895.694057296212, 8310.943464962564, 10916.928873784667, 4941.1581206945175, 5828.445808290422, 7015.988766659497, 8362.711275429814, 7716.506480983815, 7244.078312888487, 7241.155928680562, 12145.602853111039, 5568.2675049905865, 9477.439269475457, 7501.932018905456, 10077.592252584804, 10980.844043735146, 7445.500870194183, 11112.383568651616, 5100.82540966605, 8245.510988042166, 9063.25342739369, 7836.291139898524, 7934.702571840173, 4935.480517474993, 12827.96863320414, 4461.3309406831195, 7005.6391053738225, 4255.439053228793, 10099.073409741453, 8354.623769619167, 6672.126114919183, 11401.151000818314, 6780.828657789477, 5868.7680880111675, 6604.16166326823, 10340.54477789178],
          transform: [
            { type: 'identifier', as: 'cell_rank' },
            {
              type: 'formula',
              as: 'status',
              expr: "(datum.cell_rank < 50) ? 'low' : (datum.cell_rank > 90) ? 'high' : 'unknown'",
            },
          ],
        },
      ],

      signals: [
        {
          name: 'tooltip',
          value: {},
          on: [
            { events: 'rect:mouseover', update: 'datum' },
            { events: 'rect:mouseout', update: '{}' },
          ],
        },
      ],

      scales: [
        {
          name: 'xscale',
          type: 'band',
          domain: { data: 'plotData2', field: 'cell_rank' },
          range: 'width',
          padding: 0.05,
          round: true,
        },
        {
          name: 'yscale',
          domain: { data: 'plotData2', field: 'data' },
          nice: true,
          range: 'height',
        },
        {
          name: 'color',
          type: 'ordinal',
          range:
            [
              'green', '#f57b42', 'grey',
            ],
          domain: {
            data: 'plotData2',
            field: 'status',
            sort: true,
          },
        },
      ],

      axes: [
        {
          orient: 'bottom',
          scale: 'xscale',
          labels: false,
          title: { value: xAxisText2 },
        },
        {
          orient: 'left',
          scale: 'yscale',
          title: { value: yAxisText2 },
        },
      ],

      marks: [
        {
          type: 'rect',
          from: { data: 'plotData2' },
          encode: {
            enter: {
              x: { scale: 'xscale', field: 'cell_rank' },
              width: { scale: 'xscale', band: 1 },
              y: { scale: 'yscale', field: 'data' },
              y2: { scale: 'yscale', value: 0 },
            },
            update: {
              stroke: { value: 'black' },
              strokeWidth: { value: 0.5 },
              fill: {
                scale: 'color',
                field: 'status',
              },
            },
            hover: {
              fill: { value: 'red' },
            },
          },
        },
        {
          type: 'text',
          encode: {
            enter: {
              align: { value: 'center' },
              baseline: { value: 'bottom' },
              fill: { value: '#333' },
            },
            update: {
              x: { scale: 'xscale', signal: 'tooltip.category', band: 0.5 },
              y: { scale: 'yscale', signal: 'tooltip.amount', offset: -2 },
              text: { signal: 'tooltip.amount' },
              fillOpacity: [
                { test: 'datum === tooltip', value: 0 },
                { value: 1 },
              ],
            },
          },
        },
      ],
      legends: legend,
    };
  }

  render() {
    const data = { plotData: this.generateData() };
    const {
      plotToDraw, xAxisText, xAxisText2, yAxisText2, yAxisText,
      xDefaultTitle, yDefaultTitle,
    } = this.state;
    // eslint-disable-next-line react/prop-types
    const { filtering } = this.props;
    const listData = [
      'Estimated number of cells 8672',
      'Fraction reads in cells  93.1%',
      'Mean reads per cell  93,551',
      'Median genes per cell  1,297',
      'Total genes detected   21,425',
      'Median UMI counts per cell   4,064',
    ];
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
    return (
      <>
        <Row>

          <Col span={13}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>

          <Col span={5}>
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
            <List
              dataSource={listData}
              size='small'
              renderItem={(item) => (
                <List.Item>
                  {item}
                </List.Item>
              )}
            />
          </Col>


          <Col span={6}>
            <Space direction='vertical'>
              <Collapse>
                <Panel header='Filtering Settings' disabled={filtering}>
                  Min cell size:
                  <InputNumber
                    disabled={filtering}
                    defaultValue={1000}
                    onChange={(val) => this.setState({ minCellSize: val })}
                  />
                </Panel>

                <Panel header='Plot Styling' disabled={filtering}>
                  <Form.Item label='Toggle Legend'>
                    <Switch
                      defaultChecked
                      disabled={filtering}
                      onChange={(val) => this.setState({ legendEnabled: val })}
                    />
                  </Form.Item>
                  <Form.Item
                    label='X axis Title'
                  >
                    <Input
                      placeholder={xDefaultTitle}
                      onPressEnter={(val) => setAxis(val, 'x')}

                      disabled={filtering}
                    />
                  </Form.Item>
                  <Form.Item
                    label='Y axis Title'
                  >
                    <Input
                      placeholder={yDefaultTitle}
                      onPressEnter={(val) => setAxis(val, 'y')}
                      disabled={filtering}
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

export default CellSizeDistribution;
