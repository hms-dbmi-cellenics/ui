/* eslint-disable no-param-reassign */
const keyStub = 'metadata';

const metadataKeyToName = (key, stub) => key.replace(`${stub || keyStub}-`, '').replace('-', ' ');

const metadataNameToKey = (name, stub) => `${stub || keyStub}-${name.trim().replace(/\s+/g, '-')}`;

const temporaryMetadataKey = (columns) => `${keyStub}-${columns.filter((column) => column.key.match(keyStub)).length}`;

export {
  metadataKeyToName,
  metadataNameToKey,
  temporaryMetadataKey,
};
