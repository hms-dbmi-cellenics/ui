import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Space } from 'antd';

import { ClipLoader } from 'react-spinners';
import { loadExperiments } from 'redux/actions/experiments';

import Header from 'components/Header';
import MultiTileContainer from 'components/MultiTileContainer';
import NewProjectModal from 'components/data-management/NewProjectModal';
import ProjectsListContainer from 'components/data-management/ProjectsListContainer';
import ProjectDetails from 'components/data-management/ProjectDetails';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import loadBackendStatus from 'redux/actions/backendStatus/loadBackendStatus';
import { loadSamples } from 'redux/actions/samples';
import ExampleExperimentsSpace from 'components/data-management/ExampleExperimentsSpace';

const DataManagementPage = () => {
  const dispatch = useDispatch();

  const samples = useSelector((state) => state.samples);

  const { activeExperimentId } = useSelector((state) => state.experiments.meta);
  const experiments = useSelector(((state) => state.experiments));

  const activeExperiment = experiments[activeExperimentId];
  const { saving: experimentsSaving } = experiments.meta;
  const { saving: samplesSaving } = samples.meta;

  const [newProjectModalVisible, setNewProjectModalVisible] = useState(false);

  useEffect(() => {
    if (experiments.ids.length === 0) dispatch(loadExperiments());
  }, []);

  const samplesAreLoaded = () => {
    const loadedSampleIds = Object.keys(samples);
    return activeExperiment.sampleIds.every((sampleId) => loadedSampleIds.includes(sampleId));
  };

  useEffect(() => {
    if (!activeExperimentId) return;

    dispatch(loadProcessingSettings(activeExperimentId));

    if (!samplesAreLoaded()) dispatch(loadSamples(activeExperimentId));

    dispatch(loadBackendStatus(activeExperimentId));
  }, [activeExperimentId]);

  const PROJECTS_LIST = 'Projects';
  const PROJECT_DETAILS = 'Project Details';

  const TILE_MAP = {
    [PROJECTS_LIST]: {
      toolbarControls: [],
      component: (width, height) => (
        <ProjectsListContainer
          height={height}
          onCreateNewProject={() => setNewProjectModalVisible(true)}
        />
      ),
    },
    [PROJECT_DETAILS]: {
      toolbarControls: [],
      component: (width, height) => {
        if (!activeExperimentId) {
          return <ExampleExperimentsSpace introductionText='You have no projects yet.' />;
        }

        return (
          <ProjectDetails
            width={width}
            height={height}
          />
        );
      },
    },
  };

  const windows = {
    direction: 'row',
    first: PROJECTS_LIST,
    second: PROJECT_DETAILS,
    splitPercentage: 23,
  };

  return (
    <>
      <Header title='Data Management' />
      {experimentsSaving || samplesSaving ? (
        <center>
          <Space direction='vertical'>
            <ClipLoader
              size={50}
              color='#8f0b10'
            />
            Loading...
          </Space>
        </center>
      ) : (<></>)}
      {newProjectModalVisible ? (
        <NewProjectModal
          onCancel={() => { setNewProjectModalVisible(false); }}
          onCreate={() => { setNewProjectModalVisible(false); }}
        />
      ) : (<></>)}
      <MultiTileContainer
        tileMap={TILE_MAP}
        initialArrangement={windows}
      />
    </>
  );
};

export default DataManagementPage;
