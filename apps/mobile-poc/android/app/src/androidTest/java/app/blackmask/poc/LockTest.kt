package app.blackmask.poc

import android.os.Process
import android.os.SystemClock
import androidx.lifecycle.Lifecycle
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LockTest {
    @Before
    fun setUp() {
        Device.requireScreenLock()
        Device.reset()
    }

    @After
    fun tearDown() = Device.reset()

    private fun openAndUnlockVault(id: String, lockTimeoutMs: Long? = null) {
        Device.openVault(Device.probeExtras(id, "read", "", Origins.VAULT, lockTimeoutMs))
        Device.unlockVault()
        Device.awaitProbe(id)
        assertNotNull("the vault process is not running", Device.vaultPid())
    }

    @Test
    fun lockEndsTheVaultProcessAndTheChatViewKeepsRunning() {
        val token = Device.token()
        val chat = Device.launchChat(Device.probeExtras("chat-before", "write", token, Origins.SHARED))
        Device.awaitProbe("chat-before")

        openAndUnlockVault("vault-open")
        Device.awaitView("vault_button_lock")!!.click()

        assertTrue("the vault process was still running after Lock", Device.awaitVaultGone())
        assertTrue("the chat view did not survive the vault locking", chat.state.isAtLeast(Lifecycle.State.CREATED))
        chat.close()

        Device.launchChat(Device.probeExtras("chat-after", "read", "", Origins.SHARED)).use {
            val after = Device.awaitProbe("chat-after").getJSONObject("result")
            assertEquals("the chat view's own storage after the vault locked", token, after.optString("localStorage"))
        }
    }

    @Test
    fun closingTheVaultLocksIt() {
        openAndUnlockVault("vault-open")
        Device.ui.pressBack()
        assertTrue("the vault process was still running after Back", Device.awaitVaultGone())
    }

    @Test
    fun leavingTheVaultInTheBackgroundLocksItAfterTheTimeout() {
        openAndUnlockVault("vault-open", lockTimeoutMs = 2_000)
        Device.ui.pressHome()
        assertTrue("the vault process was still running 20 s after a 2 s timeout", Device.awaitVaultGone())
    }

    @Test
    fun aLockedVaultAsksForTheScreenLockAgain() {
        openAndUnlockVault("vault-first")
        Device.awaitView("vault_button_lock")!!.click()
        assertTrue(Device.awaitVaultGone())

        Device.openVault(Device.probeExtras("vault-second", "read", "", Origins.VAULT))
        assertNotNull("the reopened vault did not show its Unlock button", Device.awaitView("vault_button_unlock"))
        SystemClock.sleep(3_000)
        assertNull("the reopened vault loaded without the screen lock", Device.probeResult("vault-second"))
    }

    /**
     * Android can end a background process to free memory, then recreate its screen when the user
     * returns. The recreated vault must start locked, even though its screen comes back.
     */
    @Test
    fun aVaultEndedByAndroidInTheBackgroundComesBackLocked() {
        openAndUnlockVault("vault-before")
        Device.clearProbes()
        Device.ui.pressHome()
        assertTrue("the vault stayed on screen after Home", Device.awaitViewGone("vault_panel_unlocked"))
        // Let the vault stop and save its screen state, which is what makes Android keep the screen.
        SystemClock.sleep(2_000)

        Process.killProcess(Device.vaultPid()!!)
        assertTrue("the vault process did not end", Device.awaitVaultGone())
        assertEquals(
            "Android did not keep the vault screen to recreate",
            VaultActivity::class.java.name,
            Device.topActivityOfAppTask(),
        )

        Device.returnToApp()
        assertNotNull("the recreated vault did not show its Unlock button", Device.awaitView("vault_button_unlock"))
        SystemClock.sleep(3_000)
        // The recreated screen has the original extras, so an unlocked page would record "vault-before" again.
        assertNull("the recreated vault loaded its page without the screen lock", Device.probeResult("vault-before"))
    }
}
