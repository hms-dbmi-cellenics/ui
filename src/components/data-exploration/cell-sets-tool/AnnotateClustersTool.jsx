import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import {
  Button,
  Radio, Select, Space, Tooltip,
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

const scTypeTooltipText = (
  <>
    Automatic annotation is performed using ScType, a marker gene-based tool
    developed by Aleksandr Ianevski et al.
    It uses a marker genes database which was build using
    {' '}
    <a target='_blank' href='http://biocc.hrbmu.edu.cn/CellMarker/' rel='noreferrer'>CellMarker</a>
    ,
    {' '}
    <a target='_blank' href='https://panglaodb.se/' rel='noreferrer'>PanglaoDB</a>
    ,
    and 15 novel cell types with corresponding marker genes added by
    manual curation of more than 10 papers.
    The current version of the ScType database contains a total of
    3,980 cell markers for 194 cell types in 17 human tissues and 4,212 cell markers
    for 194 cell types in 17 mouse tissues.
    More details can be found in
    {' '}
    <a target='_blank' href='https://www.nature.com/articles/s41467-022-28803-w' rel='noreferrer'>the ScType paper</a>
    {' '}
    and in
    {' '}
    <a target='_blank' href='https://github.com/IanevskiAleksandr/sc-type' rel='noreferrer'>the ScType github repo</a>
    .
  </>
);

const AnnotateClustersTool = ({ experimentId, onRunAnnotation }) => {
  const dispatch = useDispatch();

  const [tissue, setTissue] = useState(null);
  const [species, setSpecies] = useState(null);

  return (
    <Space direction='vertical'>
      <Radio.Group>
        <Tooltip title={scTypeTooltipText}>
          <Radio>ScType</Radio>
        </Tooltip>
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
        onClick={() => {
          dispatch(runCellSetsAnnotation(experimentId, species, tissue));
          onRunAnnotation();
        }}
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
  onRunAnnotation: PropTypes.func.isRequired,
};

export default AnnotateClustersTool;
