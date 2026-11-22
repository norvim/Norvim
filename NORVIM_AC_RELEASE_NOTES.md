# Norvim AC – focused correction

- Preserved Norvim's existing notification creation/event pipeline. Application status and other notification event routes were restored to the previous Norvim Cos implementation; no broad notification event rewrite was made.
- Background web-push dispatch keeps the existing recipients and event triggers, with a five-minute TTL so stale alerts are not delivered much later.
- Premium sound choices are exactly: Norvim Bell, Norvim Chime, Soft Alert, Strong Alert, and No Sound. Gallery/custom audio has been removed completely.
- Selecting a sound immediately plays a sample. The Preview button plays it again on demand. The selected sound is saved locally and submitted to the active Premium subscription.
- Premium sound playback on active Norvim pages uses the same four generated tones for newly received notifications.
- Background notification sound remains subject to Android/browser notification settings; web pages cannot force a custom sound while fully closed. Background push displays the OS/browser notification, while the selected Norvim tone is played in an active Norvim page after audio has been unlocked by a user gesture.

## Validation
- Run `node --check` on server.js and all JavaScript files.
- Verify ZIP integrity with `unzip -t`.
- Actual background delivery and audible behavior must still be verified on the live Render deployment and target Android device.
