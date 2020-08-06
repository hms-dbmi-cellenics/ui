import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PageHeader, Button, Dropdown } from 'antd';
import { DownOutlined, PictureOutlined, ToolOutlined } from '@ant-design/icons';
import SearchMenu from '../../../../components/SearchMenu';
import { addWindow, addToWindow } from '../../../../redux/actions/layout';

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

const Header = () => {
  const [addMenuVisible, setAddMenuVisible] = useState(false);
  const dispatch = useDispatch();

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

  return (
    <>
      <PageHeader
        className='site-page-header'
        title='Investigator'
        subTitle='Powerful data exploration'
        style={{ width: '100%' }}
        extra={[
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
          </div>,
        ]}
      />
    </>
  );
};

export default Header;
