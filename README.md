# Logic Audio Scripters
Scripters for use in Logic Audio.  This repo contains common functions in the `/lib` folder which are compiled into .js files for use in the Logic Audio Scripter directory.  

# How to build

## install dependencies

These are dependencies used for bundling the .js files.

```
npm install
```

This will install Node modules to help build the Scripter scripts.

## Build the .js files

This repo uses bundle-js to bundle Scripter .js files for use in Logic Audio.  Bundle-js will bundle components into the individual files and place them in the `/dist` directory.

```
npm run build
```
Unfortunately you can't simply drop these files into a directory for Logic Audio to read.  You'll have to open the file in the `/dist` you want to import into Logic Audio, open the Scripter MIDI FX in Logic Audio, click the `Open Script in Editor` button, copy/paste the contents of the .js file into the editor, click the `Run Script` button, and choose `Save As...` from the Scripter window to save the file. The file should be saved as a `.pst` file in `~/Music/Audio Music Apps/Plug-In Settings/Scripter`.

# Scripts
## Delay Accelerate and Decelerate.js
This script is a note delay which will accelerate or decelerate and shorten or length the ndelayed notes respectively.  Note velocity can also increase or decrease. 

### paramters

#### Number of delay repeats
The number of delay notes to play.  The delay will stop if the note becomes to short or longer than eight 1/4 notes.

#### Delay acceleration rate
This is the percentage of the current delay note length to be set for the next delay note.

* < 0 : Delay will accelerate
* 0 : Delay rate will remain constant
* \> 0: Delay will decelerate

#### Velocity acceleration rate
This is the percentage of the current delay note velocity to be set for the next delay note.

* < 0 : Delay will get softer
* 0 : Delay velocity will remain constant
* \> 0: Delay will get louder

## Monophony.js
This script essentially convert a polyphonic patch to a monophonic one.  This effect allows only one note to play at a time.  The effect will track the order in which notes were played when holding multiple notes at once.  When you release the playing note it will then play the previous held note in the stack.

## Repeater.js
This script will repeat the held notes at the pulse specified in the parameters.

### parameters

#### pulse duration
Choose a note value for the repeater to repeat the note at.

#### duration percentage

This is how long each note that is repeated should be played at as a percentage of the chose pulse value.  The higher the percentage, the more legato.  The lower the percentage, the more staccato.

#### mod wheel

The mod wheel will increate the pulse.

# Dependencies

Dependencies are in the `/lib` folder.  These are meant to be reused across scripts.

## ./lib/duration-factory.js

This library provides an object to perform note duration to Logic Audio beat values.  In logic Audio, 1/4 note = 1 beat.  The object also provides an array of note values you can use to generate a note value selector menu in a parameter.

## ./lib/note-duration.js

Ths library calculates a note duration by calculating the timing between Note On and Note Off of a given note.  A property `duration` will be added to the NoteOff event providing the length of the note that was just played.
