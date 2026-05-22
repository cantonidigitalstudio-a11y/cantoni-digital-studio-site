# Chrome Profile Binding Runbook

## Objective
Force Chrome UI work onto the Cantoni profile, not the generic `Emanuele` or `EC8PLATFORM` profile.

## Bound profile
- Chrome menu label: `Emanuele (cantonidigitalstudio@gmail.com)`

## Script
- Primary: `scripts/launch_cantoni_isolated_chrome.sh`
- Fallback: `scripts/switch_to_cantoni_chrome_profile.sh`

## Usage
```bash
cd "/Volumes/Lexar/Siti internet mondiale /cantoni_site"
./scripts/launch_cantoni_isolated_chrome.sh "https://script.google.com/home"
```

## Marker written
- `sales-kit/queue/chrome_profile_binding.json`

## Rule
- If Chrome work is needed, launch the isolated Cantoni instance first.
- Do not trust whichever Chrome profile is already frontmost.
- Ignore generic `Emanuele`, `EC8PLATFORM`, and any shared Chrome instance for Cantoni operations.
- Only fall back to menu-based profile switching if the isolated launcher is unavailable.
