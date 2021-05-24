import CustomError from './customError';
import fetchAPI from './fetchAPI';

const handleResponse = async (url, response) => {
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  console.error(`Error fetching ${url}. ${response.status} ${response.statusText}`);
  throw new CustomError('There has been an error fetching the data.', response);
};

const getFromApiExpectOK = async (url, ...extras) => {
  const response = await fetchAPI(url, ...extras);
  const data = await handleResponse(url, response);
  return data;
};

const getFromUrlExpectOK = async (url) => {
  const response = await fetch(url);
  const data = await handleResponse(url, response);
  return data;
};

export {
  getFromApiExpectOK,
  getFromUrlExpectOK,
};
