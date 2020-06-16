import React, { useState } from 'react';
// import { unmountComponentAtNode } from 'react-dom';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import { Descriptions } from 'antd';
import ContainerDimensions from 'react-container-dimensions';

const VegaHeatmap = (props) => {
  const { spec } = props;
  const [geneInfo, setGeneInfo] = useState({
    geneName: 'Not Available',
    cellName: 'Not Available',
    expression: 'Not Available',
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
      <Descriptions>
        <Descriptions.Item label='Gene Name'>{geneInfo.geneName}</Descriptions.Item>
        <Descriptions.Item label='Cell Name'>{geneInfo.cellName}</Descriptions.Item>
        <Descriptions.Item label='Expression Level'>{geneInfo.expression}</Descriptions.Item>
      </Descriptions>
      <ContainerDimensions>
        {({ width, height }) => {
          spec.width = width - 40;
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
  );
};

VegaHeatmap.propTypes = {
  spec: PropTypes.object.isRequired,
};

export default VegaHeatmap;
