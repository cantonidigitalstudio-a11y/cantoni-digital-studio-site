# iPad Wireless Fallback Runbook

Purpose: use the iPad as a fallback operational screen for mobile-only flows, especially Instagram profile link edits that desktop web blocks.

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

## Current Blocker

The wireless fallback is ready and Instagram is now installed on the iPad as `com.burbn.instagram`.

The remaining blocker for full automated Instagram control is iOS developer trust. A temporary WebDriverAgent runner was built, device-registered, signed and installed as:

- App: `WebDriverAgentRunner-Runner`
- Bundle id: `com.cantonidigitalstudio.WebDriverAgentRunner.xctrunner`
- Signing identity shown by Xcode: `Apple Development: emanuelec297@gmail.com`

iOS currently refuses to launch it until the developer certificate is trusted on the iPad. Apple requires this confirmation from the device UI:

`Settings` -> `General` -> `VPN & Device Management` -> Developer App -> trust the Apple Development certificate.

After that trust step, rerun the WDA launch and continue with the Instagram mobile-only profile link edit.

Do not mark the Instagram link fix as complete until one of these is true:

1. Instagram is installed on this iPad and the link is changed inside the Instagram app.
2. The same change is completed from an iPhone or another device where the Instagram app is already installed.
3. A later Instagram web/mobile-web flow proves it can edit the clickable profile link, and Browser QA confirms the final public link.

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

## First Mobile-Only Task

Fix Instagram profile link:

1. Install Instagram on the iPad, or use the already logged-in iPhone.
2. Open Instagram app.
3. Go to `@cantonidigitalstudio`.
4. Edit profile.
5. Links.
6. Remove `zumu.be/ecantoni`.
7. Add `https://cantonidigitalstudio.com`.
8. Save.
9. Re-run Browser QA from the Mac and confirm the clickable profile link resolves to the studio domain.
