# Custom Sounds

Drop MP3 files here to override the default macOS system sounds.

| File | Used by |
|---|---|
| `john-cena.mp3` | secret-leak-gate (credential detected) |
| `service-ended.mp3` | service-ended (task complete) |
| `service-input-needed.mp3` | service-input-needed (waiting for input) |

Files are copied to `~/.claude/sounds/` on install.
System sound fallbacks (macOS):
- john-cena → `Funk.aiff`
- service-ended → `Glass.aiff`
- service-input-needed → `Ping.aiff`
- error/irreversibility → `Basso.aiff`

Sounds only play when `CLAUDE_SOUND_ALERTS=1` is set (add to `~/.claude/settings.json` env block or shell profile).
