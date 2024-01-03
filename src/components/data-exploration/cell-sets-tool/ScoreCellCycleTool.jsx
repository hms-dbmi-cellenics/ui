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
    Cell Cycle Regression is only available for mouse and human samples. It relies on the Seurat list of S and G2M genes to score each cell with S and G2M scores. Cells with higher than 0.5 score are classified at that stage of the cell cycle, and cells with less than 0.5 for both are classified as cells in G1. 
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
