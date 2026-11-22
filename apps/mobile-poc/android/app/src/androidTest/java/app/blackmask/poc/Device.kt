package app.blackmask.poc

import android.app.ActivityManager
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.os.SystemClock
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import java.io.File
import java.util.UUID

/** What the tests use to drive the app: launch views, unlock the vault, read probe results. */
internal object Device {
    private const val PACKAGE = "app.blackmask.poc"
    private const val VAULT_PROCESS = "$PACKAGE:vault"
    private const val SYSTEM_UI = "com.android.systemui"
    private const val TIMEOUT_MS = 20_000L

    val context: Context get() = InstrumentationRegistry.getInstrumentation().targetContext
    val ui: UiDevice get() = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

    /** The device PIN the CI job sets; override with -Pandroid.testInstrumentationRunnerArguments.pocPin=… */
    private val pin: String
        get() = InstrumentationRegistry.getArguments().getString("pocPin") ?: "1111"

    private val probeDir: File get() = File(context.filesDir, ProbeRecorder.PROBE_DIRECTORY)

    fun token(): String = UUID.randomUUID().toString().replace("-", "")

    fun hasScreenLock(): Boolean = context.getSystemService(KeyguardManager::class.java).isDeviceSecure

    fun requireScreenLock() =
        assertTrue("These tests need a device PIN: adb shell locksettings set-pin $pin", hasScreenLock())

    /** Closes the vault, waits for its process to end, and removes old probe results. */
    fun reset() {
        ui.pressHome()
        vaultPid()?.let { Process.killProcess(it) }
        awaitVaultGone()
        probeDir.deleteRecursively()
    }

    fun probeExtras(id: String, op: String, token: String, host: String, lockTimeoutMs: Long? = null) =
        buildMap {
            put(TestHooks.EXTRA_PROBE_ID, id)
            put(TestHooks.EXTRA_PROBE_OP, op)
            put(TestHooks.EXTRA_PROBE_TOKEN, token)
            put(TestHooks.EXTRA_PROBE_HOST, host)
            lockTimeoutMs?.let { put(TestHooks.EXTRA_LOCK_TIMEOUT_MS, it.toString()) }
        }

    fun launchChat(extras: Map<String, String>): ActivityScenario<ChatActivity> {
        val intent = Intent(context, ChatActivity::class.java)
        extras.forEach { (key, value) -> intent.putExtra(key, value) }
        return ActivityScenario.launch(intent)
    }

    /** Starts the vault. It runs in another process, so the tests drive it through the UI. */
    fun openVault(extras: Map<String, String>) {
        val intent = Intent(context, VaultActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        extras.forEach { (key, value) -> intent.putExtra(key, value) }
        context.startActivity(intent)
    }

    fun awaitView(id: String): UiObject2? = ui.wait(Until.findObject(By.res(PACKAGE, id)), TIMEOUT_MS)

    /** The PIN field of the system's screen-lock prompt, once it is showing. */
    fun awaitScreenLockPrompt(): UiObject2? =
        ui.wait(Until.findObject(By.res(SYSTEM_UI, "lockPassword")), TIMEOUT_MS)

    /** Taps Unlock and enters the device PIN in the system's screen-lock prompt. */
    fun unlockVault() {
        val unlock = awaitView("vault_button_unlock")
        assertNotNull("the vault never showed its Unlock button", unlock)
        unlock!!.click()
        val field = awaitScreenLockPrompt()
        assertNotNull("the system screen-lock prompt never appeared", field)
        field!!.click()
        SystemClock.sleep(500)
        ui.executeShellCommand("input text $pin")
        ui.executeShellCommand("input keyevent KEYCODE_ENTER")
    }

    fun awaitScreenLockPromptGone(timeoutMs: Long = 2_000): Boolean =
        ui.wait(Until.gone(By.res(SYSTEM_UI, "lockPassword")), timeoutMs)

    fun probeResult(id: String): JSONObject? =
        File(probeDir, "$id.json").takeIf { it.exists() }?.let { JSONObject(it.readText()) }

    fun awaitProbe(id: String): JSONObject {
        val deadline = SystemClock.uptimeMillis() + TIMEOUT_MS
        while (SystemClock.uptimeMillis() < deadline) {
            probeResult(id)?.let { return it }
            SystemClock.sleep(200)
        }
        throw AssertionError("no probe result '$id' within ${TIMEOUT_MS / 1000} s")
    }

    fun vaultPid(): Int? =
        context.getSystemService(ActivityManager::class.java).runningAppProcesses
            ?.firstOrNull { it.processName == VAULT_PROCESS }?.pid

    fun awaitVaultGone(timeoutMs: Long = TIMEOUT_MS): Boolean {
        val deadline = SystemClock.uptimeMillis() + timeoutMs
        while (SystemClock.uptimeMillis() < deadline) {
            if (vaultPid() == null) return true
            SystemClock.sleep(200)
        }
        return vaultPid() == null
    }

    private val STORAGE_KINDS = listOf("localStorage", "cookie", "indexedDB", "cacheStorage")

    /** The writing view could read back its own token from every kind of storage. */
    fun assertHoldsEverywhere(record: JSONObject, token: String) {
        val result = record.getJSONObject("result")
        assertTrue("the probe page failed: ${result.optString("error")}", result.isNull("error"))
        STORAGE_KINDS.forEach { kind ->
            assertEquals("$kind in the ${record.getString("view")} view, read back by the writer", token, result.optString(kind))
        }
    }

    /** The reading view found the token in no kind of storage. */
    fun assertHoldsNowhere(record: JSONObject, token: String) {
        val result = record.getJSONObject("result")
        assertTrue("the probe page failed: ${result.optString("error")}", result.isNull("error"))
        STORAGE_KINDS.forEach { kind ->
            assertNotEquals("$kind in the ${record.getString("view")} view", token, result.optString(kind))
        }
    }
}
