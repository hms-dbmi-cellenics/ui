import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import {
  Alert, Button, Space,
} from 'antd';
import { updatePlotConfig } from 'redux/actions/componentConfig';
import getTrajectoryPlotPseudoTime from 'redux/actions/componentConfig/getTrajectoryPlotPseudoTime';

const TrajectoryAnalysisNodeSelector = (props) => {
  const {
    experimentId,
    plotUuid,
    setDisplaySettings,
    displaySettings,
  } = props;

  const dispatch = useDispatch();

  const rootNodes = useSelector((state) => state.componentConfig[plotUuid]?.plotData?.nodes);
  const plotLoading = useSelector((state) => state.componentConfig[plotUuid]?.loading);
  const selectedNodes = useSelector(
    (state) => state.componentConfig[plotUuid]?.config?.selectedNodes,
  );
  const selectedCellSets = useSelector(
    (state) => state.componentConfig[plotUuid]?.config?.selectedCellSets,
  );

  const render = () => {
    if (!rootNodes) {
      return (
        <Alert
          type='info'
          message={(
            <>
              <p>
                To get started,
                {' '}
                select clusters to include in the analysis under
                {' '}
                <strong>Select data</strong>
                {' '}
                and run
                {' '}
                <strong>Calculate root nodes</strong>
              </p>
            </>
          )}
        />
      );
    }

    if (!displaySettings.showStartingNodes) {
      return (
        <p>
          Choose
          {' '}
          <strong>Starting nodes > Show</strong>
          {' '}
          under
          {' '}
          <strong>Display</strong>
          {' '}
          to show the trajectory path.
        </p>
      );
    }

    return (
      <Space direction='vertical' style={{ width: '100%' }}>
        <Alert
          type='info'
          message={(
            <>
              <p>
                Select root nodes by
                {' '}
                <strong>clicking on the white points</strong>
                . You can select multiple nodes at once by drawing a selection. To do this,
                {' '}
                <strong>
                  hold down the Shift key, and then click and drag
                </strong>
                . Nodes inside the selection will be added to the selection.
              </p>
              <p>
                Move around the plot by panning (click and drag) and zooming (pinch and zoom/scroll).
              </p>
              <p>
                Deselect nodes by clicking on a selected node, or by clicking
                {' '}
                <strong>Clear selection</strong>
                .
              </p>
            </>
          )}
        />
        <strong>{`${selectedNodes.length} nodes selected`}</strong>
        <Button
          block
          disabled={selectedNodes.length === 0 || plotLoading}
          onClick={() => {
            dispatch(updatePlotConfig(plotUuid, { selectedNodes: [] }));
          }}
        >
          Clear selection
        </Button>
        <Button
          type='primary'
          block
          disabled={selectedNodes.length === 0 || plotLoading}
          onClick={async () => {
            // Optimistic result to prevent flickering
            setDisplaySettings({
              ...displaySettings,
              showPseudotimeValues: true,
              hasRunPseudotime: true,
            });

            const success = await dispatch(
              getTrajectoryPlotPseudoTime(
                selectedNodes,
                experimentId,
                plotUuid,
                selectedCellSets,
              ),
            );

            if (!success) {
              setDisplaySettings({
                ...displaySettings,
                showPseudotimeValues: false,
                hasRunPseudotime: false,
              });
            }
          }}
        >
          {displaySettings.hasRunPseudotime ? 'Recalculate pseudotime' : 'Calculate pseudotime'}
        </Button>
      </Space>
    );
  };

  return render();
};

TrajectoryAnalysisNodeSelector.propTypes = {
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
  setDisplaySettings: PropTypes.func.isRequired,
  displaySettings: PropTypes.object.isRequired,
};

export default TrajectoryAnalysisNodeSelector;
