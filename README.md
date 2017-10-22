# ministf

### Outline
Frontend

1) display current device screen in frame
2) whenever mouseclick is registered, it is sent to the backend


Backend

1) minicap captures the current android screen at ~10 fps
2) backend sends the images to frontend on each screen capture
3) when frontend registers mouseclick, the coordinates are sent
here and using minitouch, propagated to device
4) either before, or after the event, the view hierarchy is captured

### Resources
- [minitouch](https://github.com/openstf/minitouch)
- [minicap](https://github.com/openstf/minicap)
- [openstf](https://github.com/openstf/stf)
- [crowdstf](https://github.com/datadrivendesign/mobile.crowdstf)
- [crowdstf notes](https://github.com/datadrivendesign/mobile.crowdstf/blob/replay/crowdstf/STFNotes.md)
- [crowdstf zipt interface](https://github.com/datadrivendesign/mobile.crowdstf/tree/replay/crowdstf-manager)
- [adb](https://developer.android.com/studio/command-line/adb.html)
- [pyadb](https://github.com/sch3m4/pyadb)