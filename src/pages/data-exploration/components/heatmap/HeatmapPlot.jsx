import React, { useEffect, useState } from 'react';
import { Vega } from 'react-vega';
import { Descriptions, Spin } from 'antd';
import ContainerDimensions from 'react-container-dimensions';
import initialSpec from '../../../../utils/heatmapSpec';

const HeatmapPlot = () => {
  // This will be removed once redux introduced for this component
  // eslint-disable-next-line no-unused-vars
  const [spec, setSpec] = useState(initialSpec);


  const [heatmapDataReady, setHeatmapDataReady] = useState(false);
  const [geneInfo, setGeneInfo] = useState({
    geneName: 'Not Available',
    cellName: 'Not Available',
    expression: 'Not Available',
  });

  useEffect(() => {
    setHeatmapDataReady(true);
  });


  const handleHover = (...args) => {
    if (args[1].datum) {
      setGeneInfo({
        geneName: args[1].datum.geneName,
        cellName: args[1].datum.cellName,
        expression: args[1].datum.expression,
      });
    }
  };

  const signalListeners = {
    mouseover: handleHover,
  };

  return (
    <div>
      {heatmapDataReady
        ? (
          <div>
            <Descriptions>
              <Descriptions.Item label='Gene Name'>{geneInfo.geneName}</Descriptions.Item>
              <Descriptions.Item label='Cell Name'>{geneInfo.cellName}</Descriptions.Item>
              <Descriptions.Item label='Expression Level'>{geneInfo.expression}</Descriptions.Item>
            </Descriptions>
            <ContainerDimensions>
              {({ width, height }) => {
                spec.width = width - 120;
                spec.height = height + 300;
                return (
                  <Vega
                    spec={spec}
                    signalListeners={signalListeners}
                    actions={false}
                  />
                );
              }}
            </ContainerDimensions>
          </div>
        )
        : <center><Spin size='large' /></center>}
    </div>
  );
};

export default HeatmapPlot;
