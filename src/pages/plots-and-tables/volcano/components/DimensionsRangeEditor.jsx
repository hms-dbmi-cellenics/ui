import React, { useState } from 'react';

import {
  Slider, Form, InputNumber, Checkbox, Space,
} from 'antd';


const DimensionsRangeEditor = (props) => {
  const { onUpdate } = props;

  const [maxnlpValueDomain, setMaxNlpValueDomain] = useState(null);
  const [logFoldChangeDomain, setLogFoldChangeDomain] = useState(null);
  const [maxNlpValueDomainInputEnabled, setMaxNlpValueDomainInputEnabled] = useState(false);
  const [logFoldChangeDomainInputEnabled, setLogFoldChangeDomainInputEnabled] = useState(false);


  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Dimensions</div>

        <Form.Item
          label='Width'
        >
          <Slider
            defaultValue={500}
            min={200}
            max={1000}
            onAfterChange={(value) => {
              onUpdate({ width: value });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Height'
        >
          <Slider
            defaultValue={500}
            min={200}
            max={1000}
            onAfterChange={(value) => {
              onUpdate({ height: value });
            }}
          />
        </Form.Item>

        <div>Range</div>
        <Form.Item
          label={(
            <span>
              p-value (maximum,
              {' '}
              <em>-log10</em>
              )
            </span>
          )}
        >
          <Space>
            <InputNumber
              min={0}
              disabled={!maxNlpValueDomainInputEnabled}
              onPressEnter={(e) => {
                const value = parseFloat(e.target.value);
                setMaxNlpValueDomain(value);
                onUpdate({ maxNegativeLogpValueDomain: value });
              }}
            />
            <Checkbox
              onChange={(e) => {
                const { checked } = e.target;

                if (checked) {
                  onUpdate({ maxNegativeLogpValueDomain: null });
                } else {
                  onUpdate({ maxNegativeLogpValueDomain: maxnlpValueDomain });
                }

                setMaxNlpValueDomainInputEnabled(!maxNlpValueDomainInputEnabled);
              }}
              defaultChecked={!maxNlpValueDomainInputEnabled}
            >
              Auto
            </Checkbox>
          </Space>
        </Form.Item>
        <Form.Item
          label={(
            <span>
              fold change (+/-,
              {' '}
              <em>-log2</em>
              )
            </span>
          )}
        >
          <Space>
            <InputNumber
              min={0}
              disabled={!logFoldChangeDomainInputEnabled}
              onPressEnter={(e) => {
                const value = parseFloat(e.target.value);
                setLogFoldChangeDomainInputEnabled(value);
                onUpdate({ LogFoldChangeDomain: value });
              }}
            />
            <Checkbox
              onChange={(e) => {
                const { checked } = e.target;

                if (checked) {
                  onUpdate({ logFoldChangeDomain: null });
                } else {
                  onUpdate({ logFoldChangeDomain });
                }

                setLogFoldChangeDomainInputEnabled(!logFoldChangeDomainInputEnabled);
              }}
              defaultChecked={!logFoldChangeDomainInputEnabled}
            >
              Auto
            </Checkbox>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
};

export default DimensionsRangeEditor;
