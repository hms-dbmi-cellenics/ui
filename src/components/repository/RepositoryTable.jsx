import React from 'react';
import {
  Table, Card, Button, Empty, Space, Typography,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import { useAppRouter } from 'utils/AppRouteProvider';
import { modules } from 'utils/constants';

const { Paragraph } = Typography;

const cloneExperiment = () => {
  // Dispatch an action
  console.log('Cloning experiment into your list of experiments');
};

// Make ready-to-use rows for the table
// e.g. turn sourceTitle+sourceUrl into a single <a> tag, etc.
const formatData = (data) => data.map((row) => ({
  name: row.name,
  explore: <Button onClick={cloneExperiment()}>Copy experiment</Button>,
  publication: <a href={row.publicationUrl}>{row.publicationTitle}</a>,
  dataSource: <a href={row.dataSourceUrl}>{row.dataSourceTitle}</a>,
  species: row.species,
  sampleCount: row.sampleCount,
  cellCount: row.cellCount,
  technology: row.technology,
  description: row.description,
}));

const RepositoryTable = (props) => {
  const { data } = props;
  const formattedData = formatData(data);
  const columns = [
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

  const { navigateTo } = useAppRouter();

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
        columns={columns}
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

export default RepositoryTable;
