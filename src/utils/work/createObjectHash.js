import { MD5 } from 'object-hash';

const createObjectHash = (object) => MD5(object);

export default createObjectHash;
