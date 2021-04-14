import CustomError from './customError';
import fetchAPI from './fetchAPI';

const getFromApiExpectOK = async (url) => {
  let response = null;
  if (url[0] === '/') {
    response = await fetchAPI(url);
  } else {
    response = await fetch(url);
  }
  if (response.ok) {
    const data = await response.json();
    return data;
  }

  throw new CustomError('There has been an error fetching the data.', response);
};

export default getFromApiExpectOK;
