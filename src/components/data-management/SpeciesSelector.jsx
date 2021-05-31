import React from 'react';
import PropTypes from 'prop-types';
import {
  Select, Typography, Space, Divider, Skeleton,
} from 'antd';

const { Text } = Typography;

const SpeciesSelector = (props) => {
  const { data, value, onChange } = props;

  if (!data || data.length === 0) {
    return <Skeleton.Input style={{ width: 300 }} size='small' />;
  }

  const createLabel = (scientificName, displayName) => (
    <Space direction='vertical'>
      <Text type='primary'>{displayName}</Text>
      <Text type='secondary'>
        {scientificName}
      </Text>
    </Space>
  );

  const labeledValue = (organismId) => {
    const organism = data.find((entry) => entry.id === organismId);

    return {
      value: organismId,
      label: !organismId ? <></> : createLabel(organism.scientific_name, organism.display_name),
    };
  };

  return (
    <Select
      value={labeledValue(value)}
      onChange={(selectedValue, option) => onChange(selectedValue, option)}
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
          label: createLabel(organism.display_name, organism.scientific_name),
        }))
      }
    />
  );
};

SpeciesSelector.propTypes = {
  data: PropTypes.array.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

SpeciesSelector.defaultProps = {
  value: null,
  onChange: () => { },
};

export default SpeciesSelector;
