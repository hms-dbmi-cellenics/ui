import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import {
  Button,
  Radio, Select, Space,
} from 'antd';
import { runCellSetsAnnotation } from 'redux/actions/cellSets';
import { useDispatch } from 'react-redux';

const tissueOptions = [
  'Immune system',
  'Pancreas',
  'Liver',
  'Eye',
  'Kidney',
  'Brain',
  'Lung',
  'Adrenal',
  'Heart',
  'Intestine',
  'Muscle',
  'Placenta',
  'Spleen',
  'Stomach',
  'Thymus',
];

const speciesOptions = [
  'human',
  'mouse',
];

const AnnotateClustersTool = ({ experimentId }) => {
  const dispatch = useDispatch();

  const [tissue, setTissue] = useState(null);
  const [species, setSpecies] = useState(null);

  return (
    <Space direction='vertical'>
      <Radio.Group>
        <Radio>ScType</Radio>
      </Radio.Group>

      <Space direction='vertical' style={{ width: '100%' }}>
        Tissue Type:
        <Select
          options={tissueOptions.map((option) => ({ label: option, value: option }))}
          value={tissue}
          placeholder='Select a tissue type'
          onChange={setTissue}
        />
      </Space>

      <Space direction='vertical' style={{ width: '100%' }}>
        Species:
        <Select
          options={speciesOptions.map((option) => ({ label: option, value: option }))}
          value={species}
          placeholder='Select a species'
          onChange={setSpecies}
        />
      </Space>

      <Button
        onClick={() => dispatch(runCellSetsAnnotation(experimentId, species, tissue))}
        disabled={_.isNil(tissue) || _.isNil(species)}
        style={{ marginTop: '20px' }}
      >
        Compute
      </Button>
    </Space>
  );
};

AnnotateClustersTool.defaultProps = {};

AnnotateClustersTool.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default AnnotateClustersTool;
