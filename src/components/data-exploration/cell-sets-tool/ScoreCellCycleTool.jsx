import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import {
  Button,
  Radio, Space, Tooltip,
} from 'antd';
import { runCellCycleScoring } from 'redux/actions/cellSets';
import { useDispatch } from 'react-redux';

const cycleScoringTooltipText = (
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

const ScoreCellCycleTool = ({ experimentId, onRunScoreCycle }) => {
  const dispatch = useDispatch();

  return (
    <Space direction='vertical'>
      <Radio.Group>
        <Tooltip title={cycleScoringTooltipText}>
          <Radio>Seurat</Radio>
        </Tooltip>
      </Radio.Group>

      <Button
        onClick={() => {
          dispatch(runCellCycleScoring(experimentId));
          onRunScoreCycle();
        }}
        style={{ marginTop: '20px' }}
      >
        Compute
      </Button>
    </Space>
  );
};

ScoreCellCycleTool.defaultProps = {};

ScoreCellCycleTool.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onRunScoreCycle: PropTypes.func.isRequired,
};

export default ScoreCellCycleTool;
