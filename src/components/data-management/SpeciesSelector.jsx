import React from 'react';
import PropTypes from 'prop-types';
import {
  Select, Typography, Space, Divider, Skeleton,
} from 'antd';
import _ from 'lodash';

const { Text } = Typography;

const SpeciesSelector = (props) => {
  const { data, onChange } = props;

  if (!data) {
    return <Skeleton.Input style={{ width: 300 }} size='small' />;
  }

  return (
    <Select
      onChange={(value, option) => onChange(value, option)}
      style={{ width: '100%' }}
      dropdownMatchSelectWidth={400}
      labelInValue
      showSearch
      placeholder='Search for common or scientific name...'
      filterOption={(input, option) => option.searchQuery.includes(input.toLowerCase())}
      dropdownRender={(menu) => (
        <div>
          {menu}
          <Divider style={{ margin: '4px 0' }} />
          <div style={{
            display: 'flex', flexWrap: 'nowrap', padding: 8,
          }}
          >
            <Text type='secondary' style={{ textAlign: 'center' }}>
              For information such as the reference genome corresponding
              to each species, click
              {' '}
              <a
                href='https://biit.cs.ut.ee/gprofiler/page/organism-list'
                target='_blank'
                rel='noreferrer'
              >
                here
              </a>
              {' '}
              (opens in new tab).
            </Text>
          </div>
        </div>
      )}
      options={
        data.map((organism) => ({
          value: organism.id,
          displayName: organism.display_name,
          scientificName: organism.scientific_name,
          searchQuery: `${organism.display_name} ${organism.scientific_name}`.toLowerCase(),
          label: (
            <Space direction='vertical'>
              <Text type='primary'>{organism.display_name}</Text>
              <Text type='secondary'>
                {organism.scientific_name}
              </Text>
            </Space>
          ),
        }))
      }
    />
  );
};

SpeciesSelector.propTypes = {
  data: PropTypes.array.isRequired,
  onChange: PropTypes.func,
};

SpeciesSelector.defaultProps = {
  onChange: () => { },
};

export default SpeciesSelector;
