import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Mosaic, MosaicWindow } from 'react-mosaic-component';
import { Button, Space, Empty } from 'antd';
import ReactResizeDetector from 'react-resize-detector';
import moment from 'moment';

import Header from '../../components/Header';

import NewProjectModal from './components/NewProjectModal';
import ProjectsListContainer from './components/ProjectsListContainer';

import 'react-mosaic-component/react-mosaic-component.css';
import '@blueprintjs/core/lib/css/blueprint.css';

const DataManagementPage = ({ route }) => {
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
  const [activeProjectIdx, setActiveProjectIdx] = useState(0);

  useEffect(() => {
    if (projectsList.length) {
      setNewProjectModalVisible(false);
    }
  }, [projectsList]);

  const createNewProject = (newProjectName) => {
    const newProject = {
      name: newProjectName,
      createdDate: moment().local().format('DD MMM YYYY, HH:mm:ss [GMT]Z'),
      lastModified: moment().local().format('DD MMM YYYY, HH:mm:ss [GMT]Z'),
      numSamples: 0,
      lastAnalyzed: '-',
    };

    setProjectsList([...projectsList, newProject]);
    setActiveProjectIdx(projectsList.length);
    setNewProjectModalVisible(false);
  };

  const TILE_MAP = {
    'Projects List': {
      toolbarControls: [],
      component: (width, height) => (
        <Space direction='vertical' style={{ width: '100%', overflowY: 'scroll' }}>
          <Button type='primary' block onClick={() => setNewProjectModalVisible(true)}>
            Create New Project
          </Button>
          <ProjectsListContainer projects={projectsList} height={height} activeProjectIdx={activeProjectIdx} />
        </Space>
      ),
    },
    'Data Management': {
      toolbarControls: [],
      component: (width, height) => (
        <div width={width} height={height} style={{ paddingTop: '10rem' }}>
          <Empty description='Create a new project to get started' />
        </div>
      ),
    },
  };

  const windows = {
    direction: 'row',
    first: 'Projects List',
    second: 'Data Management',
    splitPercentage: 20,
  };

  return (
    <>
      <Header
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
  route: PropTypes.string.isRequired,
};

export default DataManagementPage;
