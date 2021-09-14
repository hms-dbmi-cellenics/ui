import React, { useRef, useEffect, useState } from 'react';
import vegaEmbed, { vega } from 'vega-embed';
import hash from 'object-hash';
import webglRenderer from 'vega-webgl-renderer';

const VegaEmbed = (props) => {
  const {
    width, height, spec, signalListeners = {}, ...options
  } = props;

  const containerRef = useRef(null);
  const vegaEmbedRef = useRef(null);

  const [initialViewCreated, setInitialViewCreated] = useState(false);

  const createView = async () => {
    if (!containerRef.current) {
      return;
    }

    try {
      console.log('creating embed');
      const result = await vegaEmbed(
        containerRef.current, spec, { ...options, renderer: 'webgl' },
      );
      console.log('created embed');

      if (result) {
        vegaEmbedRef.current = result;
        console.log('running');
        const res2 = await result.view.runAsync();
        console.log('run', res2);
        setInitialViewCreated(true);
        console.log('initial view created');
      }
    } catch (e) {
      errorHandler(e);
    }
  };

  useEffect(() => {
    if (!initialViewCreated) {
      return;
    }

    if (!width || !height) {
      return;
    }

    console.log('width and/or height changed');

    const { view } = vegaEmbedRef.current;

    view.width(width).height(height).runAsync();
  }, [width, height, initialViewCreated]);

  useEffect(() => {
    if (!initialViewCreated) {
      vegaEmbedRef.current?.finalize();
    }

    console.log('spec changed');
    createView();

    return () => vegaEmbedRef.current?.finalize();
  }, [spec]);

  // useEffect(() => {
  //   if (!initialViewCreated) {
  //     return;
  //   }

  //   const { view } = vegaEmbedRef.current;
  //   const nextHash = hash.MD5(data);

  //   if (nextHash === dataHash.current) {
  //     return;
  //   }

  //   console.log('data changed');

  //   _.each(data, (val, key) => {
  //     console.log(key, val);

  //     view.change(
  //       key,
  //       vega
  //         .changeset()
  //         .remove(() => true)
  //         .insert(val),
  //     );
  //   });
  // }, [data, initialViewCreated]);

  useEffect(() => {
    if (!initialViewCreated) {
      return;
    }

    const { view } = vegaEmbedRef.current;
    const signalNames = Object.keys(signalListeners);

    if (signalNames.length === 0) {
      return;
    }

    signalNames.forEach((signalName) => {
      view.addSignalListener(signalName, signalListeners[signalName]);
    });

    return () => {
      signalNames.forEach((signalName) => {
        view.removeSignalListener(signalName, signalListeners[signalName]);
      });
    };
  }, [signalListeners, initialViewCreated]);

  const errorHandler = (error) => {
    // eslint-disable-next-line no-console
    console.warn(error);
  };

  return <div ref={containerRef} />;
};

export default VegaEmbed;
