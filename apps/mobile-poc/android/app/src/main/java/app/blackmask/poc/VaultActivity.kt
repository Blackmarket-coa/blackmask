package app.blackmask.poc

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.view.View
import android.view.WindowManager
import android.webkit.WebView
import android.widget.Button
import android.widget.FrameLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat

/**
 * The vault. Runs in its own process (see the manifest) with its own WebView data directory (see
 * [PocApplication]). Its web view is created only after the device's screen lock is confirmed.
 * Locking, closing the vault, or leaving it in the background past the timeout ends the process,
 * which clears everything the vault held in memory.
 */
class VaultActivity : AppCompatActivity() {
    private val handler = Handler(Looper.getMainLooper())
    private val lockAfterTimeout = Runnable { lockNow() }
    private var lockTimeoutMs = DEFAULT_LOCK_TIMEOUT_MS
    private var hooks: TestHooks? = null
    private var webView: WebView? = null
    private var locking = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Keep vault content out of screenshots, screen recording and the recent-apps preview.
        window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)
        setContentView(R.layout.activity_vault)

        hooks = TestHooks.parse(intent.stringExtras(), BuildConfig.DEBUG)
        hooks?.lockTimeoutMs?.let { lockTimeoutMs = it }

        findViewById<Button>(R.id.vault_button_unlock).setOnClickListener { requestUnlock() }
        findViewById<Button>(R.id.vault_button_lock).setOnClickListener { lockNow() }
    }

    private fun requestUnlock() {
        val authenticators = BIOMETRIC_STRONG or DEVICE_CREDENTIAL
        if (BiometricManager.from(this).canAuthenticate(authenticators) != BiometricManager.BIOMETRIC_SUCCESS) {
            // Without a screen lock there is nothing to confirm, so the vault stays closed.
            showStatus(getString(R.string.vault_needs_screen_lock))
            return
        }
        val prompt = BiometricPrompt(
            this,
            ContextCompat.getMainExecutor(this),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) = openVault()

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) =
                    showStatus(errString.toString())
            },
        )
        prompt.authenticate(
            BiometricPrompt.PromptInfo.Builder()
                .setTitle(getString(R.string.vault_unlock_title))
                .setSubtitle(getString(R.string.vault_unlock_subtitle))
                .setAllowedAuthenticators(authenticators)
                .build(),
        )
    }

    private fun openVault() {
        if (webView != null || locking) return
        val probe = hooks?.probe
        val recorder = probe?.let { ProbeRecorder(this, "vault", it) }
        val view = PocWebViews.create(this) { page, url ->
            if (recorder != null && url == probe?.url) recorder.collect(page)
        }
        findViewById<FrameLayout>(R.id.vault_webview_container).addView(view)
        webView = view
        findViewById<View>(R.id.vault_panel_locked).visibility = View.GONE
        findViewById<View>(R.id.vault_panel_unlocked).visibility = View.VISIBLE
        view.loadUrl(probe?.url ?: BuildConfig.VAULT_URL)
    }

    private fun showStatus(message: String) {
        findViewById<TextView>(R.id.vault_text_status).text = message
    }

    private fun lockNow() {
        if (locking) return
        locking = true
        handler.removeCallbacks(lockAfterTimeout)
        destroyWebView()
        finish()
        endProcess()
    }

    override fun onStart() {
        super.onStart()
        handler.removeCallbacks(lockAfterTimeout)
    }

    override fun onStop() {
        super.onStop()
        if (!isChangingConfigurations && !isFinishing) {
            handler.postDelayed(lockAfterTimeout, lockTimeoutMs)
        }
    }

    override fun onDestroy() {
        destroyWebView()
        super.onDestroy()
        // Closing the vault, for example with Back, locks it too.
        if (!isChangingConfigurations && !locking) {
            locking = true
            endProcess()
        }
    }

    private fun destroyWebView() {
        webView?.let { view ->
            (view.parent as? FrameLayout)?.removeView(view)
            view.destroy()
        }
        webView = null
    }

    /** Lets the activity finish first, then ends the vault process and everything in its memory. */
    private fun endProcess() {
        handler.post { Process.killProcess(Process.myPid()) }
    }

    companion object {
        const val DEFAULT_LOCK_TIMEOUT_MS = 30_000L
    }
}
