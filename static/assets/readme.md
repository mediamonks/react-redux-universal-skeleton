This directory contains static files that are not loaded through webpack, but still need to
be included in our build output. The files will be copied to the same directory that webpack
outputs the web assets, namely /version/<version number>/.

For files that needed to be included in the webroot of the application, please use the
public-root directory in the parent folder.