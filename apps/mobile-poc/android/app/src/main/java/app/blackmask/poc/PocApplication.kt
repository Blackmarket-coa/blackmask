package app.blackmask.poc

import android.app.Application
import android.webkit.WebView

class PocApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Each process keeps its WebView data (cookies, local storage, IndexedDB, caches) in its
        // own directory. This must run before the process creates its first WebView, so it is
        // here rather than in the activity.
        if (getProcessName().endsWith(VAULT_PROCESS_SUFFIX)) {
            WebView.setDataDirectorySuffix(VAULT_DATA_DIRECTORY_SUFFIX)
        }
    }

    companion object {
        const val VAULT_PROCESS_SUFFIX = ":vault"
        const val VAULT_DATA_DIRECTORY_SUFFIX = "vault"
    }
}
