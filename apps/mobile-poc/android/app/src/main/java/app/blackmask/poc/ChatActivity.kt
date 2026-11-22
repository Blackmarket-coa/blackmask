package app.blackmask.poc

import android.content.Intent
import android.os.Bundle
import android.webkit.WebView
import android.widget.Button
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity

/** Chats and Spaces. In the app this view runs Blackout's web client. */
class ChatActivity : AppCompatActivity() {
    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_chat)

        val probe = TestHooks.parse(intent.stringExtras(), BuildConfig.DEBUG)?.probe
        val recorder = probe?.let { ProbeRecorder(this, "chat", it) }
        val view = PocWebViews.create(this) { page, url ->
            if (recorder != null && url == probe?.url) recorder.collect(page)
        }
        findViewById<FrameLayout>(R.id.chat_webview_container).addView(view)
        webView = view
        view.loadUrl(probe?.url ?: BuildConfig.CHAT_URL)

        findViewById<Button>(R.id.chat_button_openVault).setOnClickListener {
            startActivity(Intent(this, VaultActivity::class.java))
        }
    }

    override fun onDestroy() {
        webView?.destroy()
        webView = null
        super.onDestroy()
    }
}

internal fun Intent.stringExtras(): Map<String, String?> =
    extras?.keySet()?.associateWith { key -> extras?.getString(key) } ?: emptyMap()
