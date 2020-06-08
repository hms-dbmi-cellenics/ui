import React, { useState } from 'react';

import {
  Slider, Form, InputNumber, Checkbox, Space,
} from 'antd';


const SchemaDesign = (props) => {
  const { onUpdate } = props;

  const [maxnlpValueDomain, setMaxNlpValueDomain] = useState(null);
  const [log2FoldChangeDomain, setLog2FoldChangeDomain] = useState(null);
  const [maxNlpValueDomainInputEnabled, setMaxNlpValueDomainInputEnabled] = useState(false);
  const [log2FoldChangeDomainInputEnabled, setLog2FoldChangeDomainInputEnabled] = useState(false);


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
              disabled={!log2FoldChangeDomainInputEnabled}
              onPressEnter={(e) => {
                const value = parseFloat(e.target.value);
                setLog2FoldChangeDomain(value);
                onUpdate({ LogFoldChangeDomain: value });
              }}
            />
            <Checkbox
              onChange={(e) => {
                const { checked } = e.target;

                if (checked) {
                  onUpdate({ logFoldChangeDomain: null });
                } else {
                  onUpdate({ logFoldChangeDomain: log2FoldChangeDomain });
                }

                setLog2FoldChangeDomainInputEnabled(!log2FoldChangeDomainInputEnabled);
              }}
              defaultChecked={!log2FoldChangeDomainInputEnabled}
            >
              Auto
            </Checkbox>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
};

export default SchemaDesign;
