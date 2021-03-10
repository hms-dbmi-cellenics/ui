import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Card, Space, Descriptions,
} from 'antd';
import { blue } from '@ant-design/colors';

import FileUploadModal from './FileUploadModal';
import { setActiveProject } from '../../redux/actions/projects';
import PrettyTime from '../PrettyTime';

const ProjectsListContainer = (props) => {
  const { height } = props;
  const dispatch = useDispatch();

  const projects = useSelector((state) => state.projects);
  const { activeProject } = projects.meta;
  const [uploadModalVisible, setUploadModalVisible] = useState(true);

  useEffect(() => {
    setUploadModalVisible(projects[activeProject]?.samples.length === 0);
  }, [activeProject]);

  const activeProjectStyle = {
    backgroundColor: blue[0],
    cursor: 'pointer',
    border: `2px solid ${blue.primary}`,
  };

  const uploadFiles = () => {
    setUploadModalVisible(false);
  };

  return (
    <>
      <FileUploadModal
        visible={uploadModalVisible}
        onCancel={() => { setUploadModalVisible(false); }}
        onUpload={uploadFiles}
      />
      <Space direction='vertical' style={{ width: '100%', height: height - 90 }}>
        {
          projects.ids.map((uuid) => (
            <Card
              key={uuid}
              type='primary'
              style={activeProject === uuid ? activeProjectStyle : { cursor: 'pointer' }}

              onClick={() => {
                dispatch(setActiveProject(uuid));
                setUploadModalVisible(projects[uuid].samples.length === 0);
              }}
            >
              <Descriptions
                layout='horizontal'
                size='small'
                column={1}
                colon=''
                title={`${projects[uuid].name} (${projects[uuid].samples.length} samples)`}

              >
                <Descriptions.Item
                  labelStyle={{ fontWeight: 'bold' }}
                  label='Created'
                >
                  <PrettyTime isoTime={projects[uuid].createdDate} />

                </Descriptions.Item>
                <Descriptions.Item
                  labelStyle={{ fontWeight: 'bold' }}
                  label='Modified'
                >
                  <PrettyTime isoTime={projects[uuid].lastModified} />

                </Descriptions.Item>
                <Descriptions.Item
                  labelStyle={{ fontWeight: 'bold' }}
                  label='Last analyzed'
                >
                  {projects[uuid].lastAnalyzed ? (
                    <PrettyTime isoTime={projects[uuid].lastAnalyzed} />
                  ) : ('never')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          ))
        }
      </Space>
    </>
  );
};

ProjectsListContainer.propTypes = {
  height: PropTypes.number,
};

ProjectsListContainer.defaultProps = {
  height: 800,
};

export default ProjectsListContainer;
