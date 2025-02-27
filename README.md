# logic-audio-scripters
Scripters for use in Logic Audio.  This repo contains common libraries in the /lib folder which are compiled into file .js files for use in the Logic Audio Scripter directory.  

# How to build

## install dependencies

```
npm install
```

This will install Node modules to help build the Scripter scripts.

## Build the .js files

This repo uses bundle-js to bundle Scripter .js files for use in Logic Audio.  These files will appear in the /dist directory.

```
npm run build
```

## Copy files to the Logic Audio Scripter directory

The Scripter directory in Logic Audio should be `~/Music/Audio Music Apps/Plug-In Settings/Scripter`. To copy the files into this directory, run:

```
npm run cp
```

If the Scripter directory is not correct for your system, edit the location in `package.json#scripts.cp`.
