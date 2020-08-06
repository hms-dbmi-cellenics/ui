/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import Document, {
  Html, Head, Main, NextScript,
} from 'next/document';

class CustomDocument extends Document {
  render() {
    return (
      <Html lang='en'>
        <Head>
          <meta name='viewport' content='width=device-width, initial-scale=1' />
          <meta charSet='utf-8' />
          <link rel='shortcut icon' href='/favicon.ico' type='image/ico' />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default CustomDocument;
