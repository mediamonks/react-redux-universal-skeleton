/* global WP_DEFINE_VERSIONING_PATH, WP_DEFINE_USE_DLL_BUNDLES */

import React from 'react';
import PropTypes from 'prop-types';
import config from 'config';

/* eslint-disable react/no-danger, arrow-body-style */
const Html = ({
  markup,
  buildInfo,
  reduxState,
  mainBundleAssets,
  scripts,

  seo: defaultSeo = {},
  jsonld = [],
  canonical,
  indexSEO,
}) => {
  const seo = defaultSeo || {};

  // TODO: Implement SEO from the outside
  // TODO: implement jsonld fro the outside

  seo.metaTitle = seo.metaTitle || config.get('meta.title');
  seo.metaDescription = seo.metaDescription || config.get('meta.description');
  seo.metaKeywords = seo.metaKeywords || config.get('meta.keywords');
  seo.metaImageFacebook =
    (seo.metaImage && seo.metaImage.src && `${seo.metaImage.src}&width=1200&height=630`) || '';
  seo.metaImageTwitter =
    (seo.metaImage && seo.metaImage.src && `${seo.metaImage.src}'&width=456&height=228`) || '';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>
          {seo.metaTitle}
        </title>
        <meta name="description" content={seo.metaDescription} />
        <meta name="keywords" content={seo.metaKeywords} />
        <meta httpEquiv="X-UA-Compatible" content="IE=Edge,chrome=1" />

        <link rel="canonical" href={canonical} />
        {!indexSEO ? <meta name="robots" content="noindex" /> : null}

        <meta httpEquiv="X-UA-Compatible" content="IE=Edge,chrome=1" />
        <meta name="viewport" content="width=device-width, user-scalable=no" />
        {mainBundleAssets.css ? <link rel="stylesheet" href={mainBundleAssets.css} /> : null}
      </head>
      <body>
        <div id="app" dangerouslySetInnerHTML={{ __html: markup }} />

        {jsonld && jsonld.length
          ? <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: `
              {
                "@context": "http://schema.org",
                "@graph": ${JSON.stringify(jsonld)}
              }
            `,
              }}
            />
          : null}

        {WP_DEFINE_USE_DLL_BUNDLES
          ? <script src={`${WP_DEFINE_VERSIONING_PATH}/vendor.dll.js`} />
          : null}

        {reduxState
          ? <script
              dangerouslySetInnerHTML={{
                __html: `var state = ${JSON.stringify(reduxState).replace(
                  /<\/script>/i,
                  '<\\/script>',
                )};`,
              }}
            />
          : null}

        <script
          dangerouslySetInnerHTML={{ __html: `var buildInfo = ${JSON.stringify(buildInfo)};` }}
        />

        {scripts.map(script => <script src={script} key={script} />)}

        {mainBundleAssets.js ? <script src={mainBundleAssets.js} /> : null}
      </body>
    </html>
  );
};

Html.defaultProps = {
  seo: null,
  jsonld: null,
};

Html.propTypes = {
  markup: PropTypes.string.isRequired,
  buildInfo: PropTypes.objectOf(PropTypes.any).isRequired,
  reduxState: PropTypes.objectOf(PropTypes.any).isRequired,
  mainBundleAssets: PropTypes.objectOf(PropTypes.string).isRequired,
  scripts: PropTypes.arrayOf(PropTypes.string).isRequired,
  seo: PropTypes.shape({
    metaTitle: PropTypes.string,
    metaDescription: PropTypes.string,
    metaKeywords: PropTypes.string,
    metaImage: PropTypes.shape({
      src: PropTypes.string,
    }),
  }),
  jsonld: PropTypes.arrayOf(PropTypes.any),
  canonical: PropTypes.string.isRequired,
  indexSEO: PropTypes.bool.isRequired,
};

export default Html;
