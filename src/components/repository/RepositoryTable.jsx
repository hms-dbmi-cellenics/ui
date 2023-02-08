import React from 'react';
import {
  Table, Card, Button, Empty, Space, Typography,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import { useAppRouter } from 'utils/AppRouteProvider';
import { modules } from 'utils/constants';
import fetchAPI from 'utils/http/fetchAPI';
import { loadExperiments, setActiveExperiment } from 'redux/actions/experiments';
import { useDispatch } from 'react-redux';

const { Paragraph } = Typography;

const RepositoryTable = (props) => {
  const cloneExperiment = async (exampleExperimentId) => {
    const url = `/v2/experiments/${exampleExperimentId}/clone`;

    const newExperimentId = await fetchAPI(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    await dispatch(loadExperiments());
    await dispatch(setActiveExperiment(newExperimentId));
    navigateTo(modules.DATA_MANAGEMENT, { experimentId: newExperimentId });
  };

  // Make ready-to-use rows for the table
  // e.g. turn sourceTitle+sourceUrl into a single <a> tag, etc.
  const formatData = (data) => data.map((row) => ({
    name: row.name,
    explore: <Button onClick={() => cloneExperiment(row.id)}>Copy experiment</Button>,
    publication: <a href={row.publicationUrl}>{row.publicationTitle}</a>,
    dataSource: <a href={row.dataSourceUrl}>{row.dataSourceTitle}</a>,
    species: row.species,
    sampleCount: row.sampleCount,
    cellCount: row.cellCount,
    technology: row.technology,
    description: row.description,
  }));

  const { data } = props;
  const formattedData = formatData(data);

  const { navigateTo } = useAppRouter();
  const dispatch = useDispatch();

  const onCloseTable = () => {
    navigateTo(modules.DATA_MANAGEMENT);
  };

  const locale = {
    emptyText: (
      <Empty
        imageStyle={{ height: 60 }}
        description={(
          <Space size='middle' direction='vertical'>
            <Paragraph>
              There are no experiments in the repository yet.
            </Paragraph>
          </Space>
        )}
      />
    ),
  };

  return (
    <Card
      title='Explore Data'
      extra={(
        <Button onClick={onCloseTable}>
          <CloseOutlined />
        </Button>
      )}
    >
      <Table
        dataSource={formattedData}
        columns={TABLE_COLUMNS}
        locale={locale}
        showHeader={formattedData.length > 0}
        pagination={false}
      />
    </Card>

  );
};

RepositoryTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.exact({
      id: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string,
      publicationTitle: PropTypes.string,
      publicationUrl: PropTypes.string,
      dataSourceTitle: PropTypes.string,
      dataSourceUrl: PropTypes.string,
      species: PropTypes.string,
      sampleCount: PropTypes.string,
      cellCount: PropTypes.string,
      technology: PropTypes.string,
    }),
  ),
};

RepositoryTable.defaultProps = {
  data: [],
};

const TABLE_COLUMNS = [
  {
    title: 'Dataset name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Select to explore',
    dataIndex: 'explore',
    key: 'explore',
  },
  {
    title: 'Link to publication',
    dataIndex: 'publication',
    key: 'publication',
  },
  {
    title: 'Link to data source',
    dataIndex: 'dataSource',
    key: 'dataSource',
  },
  {
    title: 'Species',
    dataIndex: 'species',
    key: 'species',
  },
  {
    title: 'Number of samples',
    dataIndex: 'sampleCount',
    key: 'sampleCount',
  },
  {
    title: 'Cell count estimate',
    dataIndex: 'cellCount',
    key: 'cellCount',
  },
  {
    title: 'Technology',
    dataIndex: 'technology',
    key: 'technology',
  },
  {
    title: 'Short description',
    dataIndex: 'description',
    key: 'description',
  },
];

export default RepositoryTable;
