# Media Center

All your HLS streams in one place.

This PWA allows to sync HLS playlists as a media center. The playlists should have the following schema:

```json
[
  {
    "title": "This is a section",
    "entries": [
      {
        "title": "This is a sub section",
        "entries": [
          {
            "src": "https:// ...",
            "title": "This is the video title",
            "subtitle": "This is the video subtitle",
            "cover": "https:// ..."
          }
        ]
      }
    ]
  }
]
```

Features:

 - Offline play (videos can be downloaded for future playback)
 - Google cast sender

TODO:

 - [ ] Use [megajs](https://www.npmjs.com/package/megajs) to allow downloading files from meganz without using a proxy
 - [ ] Web install
 - [ ] Implement `cast:` property in schema in order to allow `mega://...` protocol.
 - [ ] Validate playlist schema
 - [ ] Implement `raw` schema (no jsonio structure) for playlists
 - [ ] Implement `mega://` protocol for playlists
 - [ ] Downloaded / downloading icons for videos in home
 - [ ] Downloading / downloaded page
