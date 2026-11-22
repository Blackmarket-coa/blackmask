package app.blackmask.poc

import android.annotation.SuppressLint
import android.app.Application
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import org.json.JSONObject
import org.json.JSONTokener
import java.io.File

/** Hosts served from the app's own assets. `.invalid` names can never resolve on a network. */
internal object Origins {
    const val CHAT = "chat.poc.invalid"
    const val VAULT = "vault.poc.invalid"
    /** Loaded in both views by the isolation tests, so that only the data directory separates them. */
    const val SHARED = "shared.poc.invalid"
    val LOCAL = setOf(CHAT, VAULT, SHARED)
}

internal object PocWebViews {

    @SuppressLint("SetJavaScriptEnabled")
    fun create(context: Context, onPageFinished: (WebView, String) -> Unit = { _, _ -> }): WebView {
        val webView = WebView(context)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
        }
        // Serve https://<local host>/poc/<file> from the assets/poc folder, and nothing else.
        val assets = WebViewAssetLoader.AssetsPathHandler(context)
        val pocOnly = WebViewAssetLoader.PathHandler { path -> assets.handle("poc/$path") }
        val loaders = Origins.LOCAL.associateWith { host ->
            WebViewAssetLoader.Builder().setDomain(host).addPathHandler("/poc/", pocOnly).build()
        }
        webView.webViewClient = object : WebViewClientCompat() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest,
            ): WebResourceResponse? = loaders[request.url.host]?.shouldInterceptRequest(request.url)

            override fun onPageFinished(view: WebView, url: String) = onPageFinished(view, url)
        }
        return webView
    }
}

/**
 * Collects the storage probe's result from a page and writes it to the app's files directory,
 * where a test in another process can read it. Debug builds only.
 */
internal class ProbeRecorder(
    private val context: Context,
    private val view: String,
    private val probe: TestHooks.Probe,
) {
    private val handler = Handler(Looper.getMainLooper())
    private var done = false

    fun collect(webView: WebView, attemptsLeft: Int = 75) {
        if (done) return
        webView.evaluateJavascript("JSON.stringify(window.__pocResult ?? null)") { raw ->
            val json = JSONTokener(raw ?: "null").nextValue() as? String
            when {
                json != null && json != "null" -> write(JSONObject(json))
                attemptsLeft > 0 -> handler.postDelayed({ collect(webView, attemptsLeft - 1) }, 200)
                else -> write(JSONObject().put("error", "the probe page produced no result"))
            }
        }
    }

    private fun write(result: JSONObject) {
        if (done) return
        done = true
        val record = JSONObject()
            .put("view", view)
            .put("process", Application.getProcessName())
            .put("pid", Process.myPid())
            .put("result", result)
        val dir = File(context.filesDir, PROBE_DIRECTORY).apply { mkdirs() }
        val partial = File(dir, "${probe.id}.partial")
        partial.writeText(record.toString())
        partial.renameTo(File(dir, "${probe.id}.json"))
    }

    companion object {
        const val PROBE_DIRECTORY = "poc-probe"
    }
}
