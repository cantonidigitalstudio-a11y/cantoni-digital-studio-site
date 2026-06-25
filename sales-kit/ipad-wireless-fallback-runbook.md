# iPad Wireless Fallback Runbook

Purpose: use the iPad as a fallback operational screen for future mobile-only flows. The original Instagram profile link/avatar task that required this fallback was completed on 2026-05-14 and must not be treated as an open blocker unless public QA regresses.

## Current Device State - 2026-05-13

- Device: iPad Air 5th generation, iPadOS 17.4.1.
- Device UDID: `00008103-001E45811133001E`.
- CoreDevice identifier: `6018B42D-C568-5956-8363-074A52E2A6E0`.
- USB pairing: validated, then wireless debugging enabled with `xcrun xcdevice enable`.
- Developer Mode: `enabled`.
- CoreDevice transport after USB removal: `localNetwork`.
- CoreDevice tunnel: connected.
- Network discovery: `idevice_id -n` lists `00008103-001E45811133001E`.
- Display command: `xcrun devicectl device info displays` succeeds over wireless.

## Current Automation Boundary

The wireless fallback is ready and Instagram is now installed on the iPad as `com.burbn.instagram`.

The remaining blocker for full automated Instagram control is iOS developer trust. A temporary WebDriverAgent runner was built, device-registered, signed and installed as:

- App: `WebDriverAgentRunner-Runner`
- Bundle id: `com.cantonidigitalstudio.WebDriverAgentRunner.xctrunner`
- Signing identity shown by Xcode: `Apple Development: emanuelec297@gmail.com`

iOS currently refuses to launch it until the developer certificate is trusted on the iPad. Apple requires this confirmation from the device UI:

`Settings` -> `General` -> `VPN & Device Management` -> Developer App -> trust the Apple Development certificate.

After that trust step, rerun the WDA launch before using the iPad for future mobile-only profile/account automation. This is no longer required to accept the current Instagram official profile/link boundary. This is no longer required to accept the current Instagram public proof when the current verifier reports `public-proof` with `loadError=false`. Current automated QA may report `public-proof` with `loadError=false` when Instagram renders logged out, or `metadata-proof-load-error` when only metadata is reliable because the visible page rendered a load/error page; the latter is metadata proof only and not standalone public proof.

## Resolved Instagram Task - 2026-05-14

The Instagram profile link and avatar are complete unless a later public QA run proves regression:

1. Browser QA confirms the clickable profile link is `cantonidigitalstudio.com`.
2. Browser QA confirms `zumu.be/ecantoni` no longer appears in the profile.
3. Browser QA confirms the centered official avatar is visible.

Evidence referenced by the social runbooks: `/tmp/instagram-cantoni-avatar-persistent-final.png` and `/tmp/instagram-cantoni-public-final-clean.png`.

## Verification Commands

```bash
xcrun devicectl device info details --device 6018B42D-C568-5956-8363-074A52E2A6E0
idevice_id -n
xcrun devicectl device info displays --device 6018B42D-C568-5956-8363-074A52E2A6E0
xcrun devicectl device info apps --device 6018B42D-C568-5956-8363-074A52E2A6E0 --include-all-apps
xcrun devicectl device info apps --device 6018B42D-C568-5956-8363-074A52E2A6E0 --include-all-apps | rg -i 'Instagram|WebDriverAgent'
```

Success criteria:

- `developerModeStatus` is `enabled`.
- `transportType` is `localNetwork` after USB is disconnected.
- `idevice_id -n` lists `00008103-001E45811133001E`.
- display inspection works over wireless.
- app inventory lists both `com.burbn.instagram` and `com.cantonidigitalstudio.WebDriverAgentRunner.xctrunner`.

## Future Mobile-Only Regression Procedure

Use this procedure only if a future public QA run shows the Instagram profile regressed to the old link or wrong avatar:

1. Trust the installed WebDriverAgent developer certificate on the iPad, or use an already trusted/logged-in iPhone.
2. Open Instagram app.
3. Go to `@cantonidigitalstudio`.
4. Edit profile.
5. Links.
6. Remove any stale `zumu.be/ecantoni` profile link if it reappears.
7. Add or confirm `https://cantonidigitalstudio.com`.
8. Save.
9. Re-run Browser QA from the Mac and confirm the clickable profile link resolves to the studio domain.
