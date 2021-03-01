import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Mosaic, MosaicWindow, RemoveButton } from 'react-mosaic-component';
import { Button } from 'antd';
import ReactResizeDetector from 'react-resize-detector';

import Header from '../../components/Header';

import NewProjectModal from './components/NewProjectModal';

import 'react-mosaic-component/react-mosaic-component.css';
import '@blueprintjs/core/lib/css/blueprint.css';

const DataManagementPage = ({ experimentId, experimentData, route }) => {
  const renderWindow = (tile, width, height) => {
    if (tile) {
      return (
        <div style={{ padding: '10px' }}>
          {height && width ? tile(width, height) : <></>}
        </div>
      );
    }
    return <></>;
  };

  const [projectsList, setProjectsList] = useState([]);
  const [newProjectModalVisible, setNewProjectModalVisible] = useState(true);

  useEffect(() => {
    if (projectsList.length) {
      setNewProjectModalVisible(false);
    }
  }, [projectsList]);

  const createNewProject = () => {
    setNewProjectModalVisible(false);
  };

  const TILE_MAP = {
    'Projects List': {
      toolbarControls: [<RemoveButton />],
      component: (width, height) => (
        <div width={width} height={height}>
          <Button type='primary' block onClick={() => setNewProjectModalVisible(true)}>
            Create New Project
          </Button>
        </div>
      ),
    },
    'Data Management': {
      toolbarControls: [
        <RemoveButton />,
      ],
      component: (width, height) => (
        <div width={width} height={height} />
      ),
    },
  };

  const windows = {
    direction: 'row',
    first: 'Projects List',
    second: 'Data Management',
    splitPercentage: 15,
  };

  return (
    <>
      <Header
        experimentId={experimentId}
        experimentData={experimentData}
        route={route}
        title='Data Management'
      />
      <NewProjectModal
        visible={newProjectModalVisible}
        onCancel={() => { setNewProjectModalVisible(false); }}
        onCreate={createNewProject}
      />
      <div style={{ height: '100%', width: '100%', margin: 0 }}>
        <Mosaic
          renderTile={(id, path) => (
            <ReactResizeDetector
              handleWidth
              handleHeight
              refreshMode='throttle'
              refreshRate={500}
            >
              {({ width, height }) => (
                <MosaicWindow
                  path={path}
                  title={id}
                  toolbarControls={TILE_MAP[id].toolbarControls}
                >
                  {renderWindow(TILE_MAP[id].component, width, height)}
                </MosaicWindow>
              )}
            </ReactResizeDetector>
          )}
          initialValue={windows}
        />
      </div>
    </>
  );
};

DataManagementPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
  route: PropTypes.string.isRequired,
};

export default DataManagementPage;
