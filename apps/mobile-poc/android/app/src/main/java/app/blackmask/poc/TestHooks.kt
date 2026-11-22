package app.blackmask.poc

/**
 * Instructions a test can pass to an activity through intent extras. Honoured only in debug
 * builds; a release build ignores them.
 */
internal data class TestHooks(val probe: Probe?, val lockTimeoutMs: Long?) {

    /** Load the storage probe page on [host] and record what it finds under [id]. */
    data class Probe(val id: String, val op: String, val token: String, val host: String) {
        // Every part is validated in [parse], so no encoding is needed.
        val url: String get() = "https://$host/poc/probe.html?op=$op&token=$token"
    }

    companion object {
        const val EXTRA_PROBE_ID = "poc.probeId"
        const val EXTRA_PROBE_OP = "poc.probeOp"
        const val EXTRA_PROBE_TOKEN = "poc.probeToken"
        const val EXTRA_PROBE_HOST = "poc.probeHost"
        const val EXTRA_LOCK_TIMEOUT_MS = "poc.lockTimeoutMs"

        private val SAFE = Regex("[A-Za-z0-9-]{1,64}")
        private val OPS = setOf("write", "read")

        fun parse(extras: Map<String, String?>, enabled: Boolean): TestHooks? {
            if (!enabled) return null
            val id = extras[EXTRA_PROBE_ID]
            val op = extras[EXTRA_PROBE_OP]
            val token = extras[EXTRA_PROBE_TOKEN] ?: ""
            val host = extras[EXTRA_PROBE_HOST]
            val probe =
                if (id != null && SAFE.matches(id) && op in OPS && host in Origins.LOCAL &&
                    (token.isEmpty() || SAFE.matches(token))
                ) {
                    Probe(id, op!!, token, host!!)
                } else {
                    null
                }
            val lockTimeoutMs = extras[EXTRA_LOCK_TIMEOUT_MS]?.toLongOrNull()?.takeIf { it >= 0 }
            return if (probe == null && lockTimeoutMs == null) null else TestHooks(probe, lockTimeoutMs)
        }
    }
}
