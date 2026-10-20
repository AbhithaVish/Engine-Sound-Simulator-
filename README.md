# MN82 Diesel Sound Simulator (Web Prototype)

A mobile-first HTML/CSS/JavaScript prototype for a Redmi Note 12 mounted on an MN82 RC Land Cruiser.


## Try it your self - https://abhithavish.github.io/Engine-Sound-Simulator-/
## Included
- Start/Stop controls
- Motion sensor permission button
- Filtered motion score and virtual RPM display
- Four real-recording audio layers with short crossfades
- Local audio-file selectors; chosen audio is not uploaded
- Sensitivity and volume controls

## Add real diesel recordings
The app does not include copyrighted sound recordings. Add your own licensed recordings using the file pickers in the app:
1. Diesel idle loop
2. Low-RPM loop
3. Mid-RPM loop
4. High-RPM loop
5. Optional start/shutdown sound

For best transitions, use loops recorded from the same engine, with similar microphone position and volume. Avoid using a short one-shot rev as a loop. Keep a copy of the licence/attribution if required.

Potential sources:
- Toyota Land Cruiser 3L Diesel 4x4 sound library (paid, specific vehicle recordings): https://sonniss.com/sound-effects/toyota-land-cruiser/
- Freesound diesel start/idle/revs (check the page's licence and attribution): https://freesound.org/people/DAVESTALKER/sounds/443319/
- Freesound truck revving and idling (CC0 according to the listing): https://freesound.org/people/wesleywestmusic/sounds/680686/
- Pixabay diesel engine sound effects: https://pixabay.com/sound-effects/search/diesel%20engine/

## Run locally
You can open `index.html` directly to inspect the interface, but sensor APIs may be unavailable from a `file://` URL. For sensor testing, host it on HTTPS (for example, GitHub Pages) and open the HTTPS URL in Chrome on the phone.

## GitHub Pages
1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, `app.js`, and this README.
3. Enable Pages in repository settings, deploying from the main branch/root.
4. Open the HTTPS Pages URL on the Redmi Note 12.
5. Tap **Enable motion sensor**, grant permission if asked, select the audio recordings, then tap **START ENGINE**.

## Important limitations
- Phone accelerometer readings measure motion/acceleration, not actual wheel speed. This prototype maps changes in sensor readings to a *virtual RPM*.
- Constant-speed motion may not produce acceleration readings, so the sound will not precisely track true wheel speed.
- Web apps may be suspended when Chrome is backgrounded or the screen is locked.
- Start audio requires a user gesture under common browser autoplay policies.
- Mount the phone securely; vibrations and chassis impacts can trigger RPM changes.
