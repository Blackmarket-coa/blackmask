package app.blackmask.poc

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Both views load the same origin here, so only the separate process and data directory keep their
 * storage apart. With different origins the browser would separate them anyway.
 */
@RunWith(AndroidJUnit4::class)
class IsolationTest {
    @Before
    fun setUp() {
        Device.requireScreenLock()
        Device.reset()
    }

    @After
    fun tearDown() = Device.reset()

    @Test
    fun theVaultCannotReadWhatTheChatViewStored() {
        val token = Device.token()
        Device.launchChat(Device.probeExtras("chat-write", "write", token, Origins.SHARED)).use {
            val written = Device.awaitProbe("chat-write")
            Device.assertHoldsEverywhere(written, token)

            Device.openVault(Device.probeExtras("vault-read", "read", "", Origins.SHARED))
            Device.unlockVault()
            val read = Device.awaitProbe("vault-read")

            assertTrue("the vault ran in ${read.getString("process")}", read.getString("process").endsWith(":vault"))
            assertNotEquals("the vault and chat views shared a process", written.getInt("pid"), read.getInt("pid"))
            Device.assertHoldsNowhere(read, token)
        }
    }

    @Test
    fun theChatViewCannotReadWhatTheVaultStored() {
        val token = Device.token()
        Device.openVault(Device.probeExtras("vault-write", "write", token, Origins.SHARED))
        Device.unlockVault()
        val written = Device.awaitProbe("vault-write")
        Device.assertHoldsEverywhere(written, token)

        Device.launchChat(Device.probeExtras("chat-read", "read", "", Origins.SHARED)).use {
            val read = Device.awaitProbe("chat-read")
            assertNotEquals("the vault and chat views shared a process", written.getInt("pid"), read.getInt("pid"))
            Device.assertHoldsNowhere(read, token)
        }
    }
}
