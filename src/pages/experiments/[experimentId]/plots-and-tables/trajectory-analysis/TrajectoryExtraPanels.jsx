import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import {
  Alert, Button, Radio, Space,
} from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { updatePlotConfig } from 'redux/actions/componentConfig';
import getTrajectoryPlotPseudoTime from 'redux/actions/componentConfig/getTrajectoryPlotPseudoTime';

const plotUuid = 'trajectoryAnalysisMain';

const TrajectoryExtraPanels = (props) => {
  const { experimentId, setPlotState, plotState } = props;

  const dispatch = useDispatch();

  const selectedNodes = useSelector((state) => state.componentConfig[plotUuid]?.config?.selectedNodes);
  const pseudotime = useSelector((state) => state.componentConfig[plotUuid]?.pseudotime);
  const plotLoading = useSelector((state) => state.componentConfig[plotUuid]?.loading);

  return (
    <>
      <CollapsePanel header='Trajectory analysis' key='trajectory-analysis'>
        {
          plotState.displayTrajectory ? (
            <Space direction='vertical' style={{ width: '100%' }}>
              <Alert
                type='info'
                message={(
                  <>
                    <p>
                      To get started, select root nodes by
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
              {selectedNodes?.length > 0 && (
                <>
                  <strong>{`${selectedNodes.length} nodes selected`}</strong>
                  <Button
                    block
                    disabled={plotLoading}
                    onClick={() => {
                      dispatch(updatePlotConfig(plotUuid, { selectedNodes: [] }));
                    }}
                  >
                    Clear selection
                  </Button>
                  <Button
                    type='primary'
                    block
                    disabled={plotLoading}
                    onClick={async () => {
                      // Optimistic result to prevent flickering
                      setPlotState({
                        ...plotState,
                        displayPseudotime: true,
                        hasRunPseudotime: true,
                      });

                      const success = await dispatch(getTrajectoryPlotPseudoTime(selectedNodes, experimentId, plotUuid));
                      if (!success) {
                        setPlotState({
                          ...plotState,
                          displayPseudotime: false,
                          hasRunPseudotime: false,
                        });
                      }
                    }}
                  >
                    {plotState.hasRunPseudotime ? 'Recalculate' : 'Calculate'}
                  </Button>
                </>
              )}
            </Space>
          ) : (
            <p>
              Choose
              {' '}
              <strong>Trajectory > Show</strong>
              {' '}
              under
              {' '}
              <strong>Display</strong>
              {' '}
              to show the trajectory path.
            </p>
          )
        }
      </CollapsePanel>
      <CollapsePanel header='Display' key='display'>
        <Space
          style={{ marginLeft: '5%' }}
          direction='vertical'
        >
          <b>Plot values</b>
          <Radio.Group
            value={plotState.displayPseudotime}
            onChange={(e) => setPlotState({
              ...plotState,
              displayPseudotime: e.target.value,
            })}
          >
            <Space>
              <Radio value={false}>Clusters</Radio>
              <Radio disabled={pseudotime} value>
                Pseudotime
              </Radio>
            </Space>
          </Radio.Group>
          <b>Trajectory</b>
          <Radio.Group
            value={plotState.displayTrajectory}
            onChange={(e) => {
              setPlotState({
                ...plotState,
                displayTrajectory: e.target.value,
              });
            }}
          >
            <Space>
              <Radio value>Show</Radio>
              <Radio value={false}>Hide</Radio>
            </Space>
          </Radio.Group>
        </Space>
      </CollapsePanel>
    </>
  );
};

TrajectoryExtraPanels.propTypes = {
  experimentId: PropTypes.string.isRequired,
  setPlotState: PropTypes.func.isRequired,
  plotState: PropTypes.object.isRequired,
};

export default TrajectoryExtraPanels;
