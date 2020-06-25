import React from 'react';
import Document, {
  Html, Head, Main, NextScript,
} from 'next/document';
import { resetServerContext } from 'react-beautiful-dnd';

class CustomDocument extends Document {
  static async getInitialProps(ctx) {
    const originalRenderPage = ctx.renderPage;
    ctx.renderPage = () => originalRenderPage({
      enhanceApp: (App) => (props) => {
        resetServerContext();
        return <App {...props} />;
      },
    });
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

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
