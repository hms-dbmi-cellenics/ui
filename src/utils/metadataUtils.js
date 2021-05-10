/* eslint-disable no-param-reassign */
const metadataKeyToName = (key) => key.replace('-', ' ');

const metadataNameToKey = (name) => `${name.trim().replace(/\s+/g, '-')}`;

const temporaryMetadataKey = (columns) => `metadata-${columns.length}`;

export {
  metadataKeyToName,
  metadataNameToKey,
  temporaryMetadataKey,
};
