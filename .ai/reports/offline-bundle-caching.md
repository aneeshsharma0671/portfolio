# Offline Game Bundle Implementation Plan

## Goal
Bundle the Sudoku game inside the Android APK so it works offline from first install.
Updates are downloaded silently in the background when online.

## Architecture Overview

```
First install:
  APK contains game-bundle.zip
  └── on launch → unzip to internal storage → WebView loads file://

Subsequent launches:
  Check /api/game-version in background
  ├── same version → load from internal storage
  ├── new version  → download new zip silently → swap on next launch
  └── no network   → load from internal storage (always works)
```

## Website Changes (portfolio repo)

### 1. Make Sudoku page fully static
Ensure `/games/sudoku` uses no server-side data fetching.
All logic must be client-side (already the case currently).

### 2. Static export script
Add a script to export only the Sudoku route as static HTML + assets:

```json
// package.json
"scripts": {
  "export:sudoku": "next build && next export -o out && zip -r sudoku-bundle.zip out/games/sudoku"
}
```

The zip contains:
```
sudoku-bundle.zip
├── index.html
├── _next/
│   ├── static/chunks/*.js
│   └── static/css/*.css
└── assets/ (fonts, images)
```

### 3. Version API endpoint
Create `app/api/game-version/route.ts`:

```ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const game = searchParams.get('game')

  const versions: Record<string, { version: string; bundleUrl: string }> = {
    sudoku: {
      version: '1.0.0',
      bundleUrl: 'https://thesharmaproject.com/bundles/sudoku-1.0.0.zip',
    },
  }

  const data = versions[game ?? '']
  if (!data) return Response.json({ error: 'unknown game' }, { status: 404 })
  return Response.json(data)
}
```

Bump `version` and `bundleUrl` every time you deploy a new game build.

### 4. Host the zip
Options (pick one):
- GitHub Releases on the portfolio repo (free, simple)
- `/public/bundles/sudoku-x.x.x.zip` served from the site itself

---

## Android App Changes (Sudoku-plain repo)

### 1. Ship initial bundle in APK
Place the zip at:
```
app/src/main/assets/sudoku-bundle.zip
```
This is the baseline version — users can play immediately after install.

### 2. BundleManager.kt
New file to handle unzip, version tracking, and updates:

```kotlin
object BundleManager {
    private const val PREFS = "bundle_prefs"
    private const val KEY_VERSION = "bundle_version"
    private const val BUNDLED_VERSION = "1.0.0"  // must match APK asset version

    fun getGameDir(context: Context): File =
        File(context.filesDir, "sudoku-game")

    fun getCurrentVersion(context: Context): String =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_VERSION, null) ?: "none"

    fun saveVersion(context: Context, version: String) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_VERSION, version).apply()

    fun extractBundledAssets(context: Context) {
        val dir = getGameDir(context)
        dir.deleteRecursively()
        dir.mkdirs()
        context.assets.open("sudoku-bundle.zip").use { input ->
            ZipInputStream(input).use { zip ->
                var entry = zip.nextEntry
                while (entry != null) {
                    val file = File(dir, entry.name)
                    if (entry.isDirectory) {
                        file.mkdirs()
                    } else {
                        file.parentFile?.mkdirs()
                        file.outputStream().use { zip.copyTo(it) }
                    }
                    entry = zip.nextEntry
                }
            }
        }
        saveVersion(context, BUNDLED_VERSION)
    }
}
```

### 3. UpdateManager.kt
Handles background version check and download:

```kotlin
object UpdateManager {
    private const val VERSION_API =
        "https://thesharmaproject.com/api/game-version?game=sudoku"

    fun checkAndUpdate(context: Context) {
        Thread {
            try {
                val response = URL(VERSION_API).readText()
                val json = JSONObject(response)
                val latestVersion = json.getString("version")
                val bundleUrl = json.getString("bundleUrl")
                val currentVersion = BundleManager.getCurrentVersion(context)

                if (latestVersion != currentVersion) {
                    downloadAndApply(context, bundleUrl, latestVersion)
                }
            } catch (e: Exception) {
                // no network or server error — silently ignore
            }
        }.start()
    }

    private fun downloadAndApply(context: Context, url: String, version: String) {
        val zipFile = File(context.cacheDir, "sudoku-update.zip")
        URL(url).openStream().use { input ->
            zipFile.outputStream().use { input.copyTo(it) }
        }
        val dir = BundleManager.getGameDir(context)
        dir.deleteRecursively()
        dir.mkdirs()
        ZipInputStream(zipFile.inputStream()).use { zip ->
            var entry = zip.nextEntry
            while (entry != null) {
                val file = File(dir, entry.name)
                if (entry.isDirectory) file.mkdirs()
                else {
                    file.parentFile?.mkdirs()
                    file.outputStream().use { zip.copyTo(it) }
                }
                entry = zip.nextEntry
            }
        }
        zipFile.delete()
        BundleManager.saveVersion(context, version)
    }
}
```

### 4. MainActivity.kt changes
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // First launch: extract bundled assets
    if (BundleManager.getCurrentVersion(this) == "none") {
        BundleManager.extractBundledAssets(this)
    }

    // Background update check
    UpdateManager.checkAndUpdate(this)

    // Load from local file
    val gameDir = BundleManager.getGameDir(this)
    val indexFile = File(gameDir, "index.html")
    webView.loadUrl("file://${indexFile.absolutePath}")
}
```

### 5. WebView settings for local files
```kotlin
webView.settings.apply {
    javaScriptEnabled = true
    domStorageEnabled = true
    allowFileAccess = true
    allowFileAccessFromFileURLs = true
}
```

---

## Release Workflow

When you update the game:

1. Build static export: `npm run export:sudoku`
2. Upload zip to hosting with new version name (e.g. `sudoku-1.1.0.zip`)
3. Update `/api/game-version` to return new version + URL
4. Deploy website
5. Existing users get update silently on next launch when online

When you want to ship a new baseline in the APK:
1. Replace `app/src/main/assets/sudoku-bundle.zip`
2. Update `BUNDLED_VERSION` in `BundleManager.kt`
3. Bump `versionCode` in `build.gradle`
4. Build and upload new AAB to Play Store

---

## Open Questions
- Is the Sudoku page fully static (no server-side data)? If yes, `next export` works cleanly.
- Where to host the zip? GitHub Releases is simplest and free.
- Should the update apply immediately on next app open, or only after a full restart?
