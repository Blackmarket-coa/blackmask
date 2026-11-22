package app.blackmask.poc

import android.os.SystemClock
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class GateTest {
    @Before
    fun setUp() {
        Device.requireScreenLock()
        Device.reset()
    }

    @After
    fun tearDown() = Device.reset()

    @Test
    fun theVaultStaysClosedUntilTheScreenLockIsConfirmed() {
        Device.openVault(Device.probeExtras("vault-gate", "read", "", Origins.VAULT))
        assertNotNull("the vault did not show its Unlock button", Device.awaitView("vault_button_unlock"))
        SystemClock.sleep(4_000)
        assertNull("the vault loaded its page without the screen lock", Device.probeResult("vault-gate"))
    }

    @Test
    fun cancellingTheScreenLockKeepsTheVaultClosed() {
        Device.openVault(Device.probeExtras("vault-cancel", "read", "", Origins.VAULT))
        Device.awaitView("vault_button_unlock")!!.click()
        assertNotNull("the system screen-lock prompt never appeared", Device.awaitScreenLockPrompt())
        // Back first hides the keyboard, then cancels the prompt.
        repeat(2) {
            if (Device.awaitScreenLockPromptGone()) return@repeat
            Device.ui.pressBack()
        }
        assertTrue("the screen-lock prompt did not close", Device.awaitScreenLockPromptGone())
        SystemClock.sleep(3_000)
        assertNull("the vault loaded its page after the prompt was cancelled", Device.probeResult("vault-cancel"))
    }
}
