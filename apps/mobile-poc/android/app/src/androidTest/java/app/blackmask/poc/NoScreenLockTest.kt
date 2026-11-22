package app.blackmask.poc

import android.os.SystemClock
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/** Runs before a PIN is set: with no screen lock, the vault must never open unprotected. */
@RunWith(AndroidJUnit4::class)
class NoScreenLockTest {
    @Before
    fun setUp() {
        assertFalse("This test needs a device with no screen lock", Device.hasScreenLock())
        Device.reset()
    }

    @After
    fun tearDown() = Device.reset()

    @Test
    fun withoutAScreenLockTheVaultNeverOpens() {
        Device.openVault(Device.probeExtras("vault-nolock", "read", "", Origins.VAULT))
        Device.awaitView("vault_button_unlock")!!.click()
        SystemClock.sleep(3_000)
        assertEquals(
            Device.context.getString(R.string.vault_needs_screen_lock),
            Device.awaitView("vault_text_status")!!.text,
        )
        assertNull("the vault loaded its page with no screen lock", Device.probeResult("vault-nolock"))
    }
}
