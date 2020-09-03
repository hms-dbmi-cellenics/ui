import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  PageHeader, Button, Dropdown, Skeleton,
} from 'antd';
import { DownOutlined, PictureOutlined, ToolOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import useSWR from 'swr';
import SearchMenu from '../../../../../../components/SearchMenu';
import { addWindow, addToWindow } from '../../../../../../redux/actions/layout';
import getApiEndpoint from '../../../../../../utils/apiEndpoint';
import { getFromApiExpectOK } from '../../../../../../utils/cacheRequest';
import itemRender from '../../../../../../utils/renderBreadcrumbLinks';

const categoryInfo = {
  Plots: <PictureOutlined />,
  Tools: <ToolOutlined />,
};

const categoryItems = {
  Tools: [
    {
      description: 'Create and manage interesting groupings of cells.',
      key: 'Cell set',
    },
    {
      description: 'Find, organize, and annotate genes in your data set.',
      key: 'Gene list',
      group: 'Tools',
    },
    {
      description: 'Find and explore the most characteristic genes in a set of cells.',
      key: 'Differential expression',
      group: 'Tools',
    },
  ],
  Plots: [
    {
      key: 'UMAP Embedding',
      description: 'Visualize cells clustered by genetic expression using a UMAP embedding.',
    },
    {
      key: 'Heatmap',
      description: 'Gain a high-level understanding of expression levels across large groups of genes and cells.',
    },
  ],
};

const Header = (props) => {
  const [addMenuVisible, setAddMenuVisible] = useState(false);
  const dispatch = useDispatch();

  const { experimentId } = props;

  const { data } = useSWR(`${getApiEndpoint()}/v1/experiments/${experimentId}`, getFromApiExpectOK);

  const searchMenu = (
    <SearchMenu
      options={categoryItems}
      categoryInfo={categoryInfo}
      onSelect={(key, category, belongsToGroup) => {
        if (belongsToGroup) {
          dispatch(addToWindow(key, belongsToGroup));
        } else {
          dispatch(addWindow(key));
        }
        setAddMenuVisible(false);
      }}
    />
  );

  if (!data) {
    return <Skeleton.Input style={{ width: 200 }} active />;
  }

  const routes = [
    {
      path: 'experiments',
      breadcrumbName: 'Experiments',
    },
    {
      path: '[experimentId]',
      params: data.experimentId,
      breadcrumbName: data.experimentName,
    },
    {
      path: 'data-exploration',
      breadcrumbName: 'Data Exploration',
    },
  ];

  return (
    <>
      <PageHeader
        title='Data Exploration'
        style={{ width: '100%', paddingTop: '12px', paddingBottom: '6px' }}
        breadcrumb={{ routes, itemRender }}
        extra={(
          <div>
            <Dropdown
              key='search-menu-dropdown'
              overlay={searchMenu}
              visible={addMenuVisible}
              onVisibleChange={(visible) => setAddMenuVisible(visible)}
            >
              <Button type='primary' onClick={() => setAddMenuVisible(!addMenuVisible)}>
                Add
                {' '}
                <DownOutlined />
              </Button>
            </Dropdown>
          </div>
        )}
      />
    </>
  );
};


Header.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default Header;
