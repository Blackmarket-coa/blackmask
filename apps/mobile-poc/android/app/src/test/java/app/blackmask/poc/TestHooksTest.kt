package app.blackmask.poc

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class TestHooksTest {
    private val write = mapOf(
        TestHooks.EXTRA_PROBE_ID to "chat-write",
        TestHooks.EXTRA_PROBE_OP to "write",
        TestHooks.EXTRA_PROBE_TOKEN to "abc-123",
        TestHooks.EXTRA_PROBE_HOST to Origins.SHARED,
    )

    @Test
    fun `release builds ignore every hook`() {
        assertNull(TestHooks.parse(write + (TestHooks.EXTRA_LOCK_TIMEOUT_MS to "1000"), enabled = false))
    }

    @Test
    fun `a valid probe builds a local probe URL`() {
        val probe = TestHooks.parse(write, enabled = true)?.probe
        assertNotNull(probe)
        assertEquals("https://shared.poc.invalid/poc/probe.html?op=write&token=abc-123", probe!!.url)
    }

    @Test
    fun `a probe may only load a local host`() {
        assertNull(TestHooks.parse(write + (TestHooks.EXTRA_PROBE_HOST to "example.com"), true)?.probe)
    }

    @Test
    fun `a probe token or id with other characters is refused`() {
        assertNull(TestHooks.parse(write + (TestHooks.EXTRA_PROBE_TOKEN to "a&op=read"), true)?.probe)
        assertNull(TestHooks.parse(write + (TestHooks.EXTRA_PROBE_ID to "../x"), true)?.probe)
    }

    @Test
    fun `only the write and read operations exist`() {
        assertNull(TestHooks.parse(write + (TestHooks.EXTRA_PROBE_OP to "delete"), true)?.probe)
    }

    @Test
    fun `a lock timeout can be set without a probe`() {
        val hooks = TestHooks.parse(mapOf(TestHooks.EXTRA_LOCK_TIMEOUT_MS to "2000"), true)
        assertNull(hooks?.probe)
        assertEquals(2000L, hooks?.lockTimeoutMs)
    }

    @Test
    fun `a negative or malformed timeout is ignored`() {
        assertNull(TestHooks.parse(mapOf(TestHooks.EXTRA_LOCK_TIMEOUT_MS to "-5"), true))
        assertNull(TestHooks.parse(mapOf(TestHooks.EXTRA_LOCK_TIMEOUT_MS to "soon"), true))
    }
}
