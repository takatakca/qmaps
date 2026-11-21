package ca.qmaps.mobile.test

import android.app.Activity
import android.app.Instrumentation
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import ca.qmaps.mobile.MainActivity

/** Runs against the installed APK and its real activity on the emulator. */
class JourneyInstrumentation : Instrumentation() {
    override fun onCreate(arguments: Bundle?) {
        super.onCreate(arguments)
        start()
    }

    override fun onStart() {
        val result = runCatching {
            val launch = Intent(targetContext, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            val activity = startActivitySync(launch)
            try {
                var interaction: Result<Unit>? = null
                runOnMainSync {
                    interaction = runCatching {
                        val root = activity.window.decorView
                        check(root.findText("Rechercher") != null) { "Search control missing" }
                        val accountTab = checkNotNull(root.findText("Compte")) { "Account tab missing" }
                        check(accountTab.performClick()) { "Account tab did not accept click" }
                        check(root.findText("Se connecter") != null) { "Sign-in form missing" }
                    }
                }
                checkNotNull(interaction).getOrThrow()
            } finally {
                runOnMainSync { activity.finish() }
            }
        }
        val response = Bundle().apply {
            putString("qmaps_result", if (result.isSuccess) "passed" else "failed")
            putString("stream", result.exceptionOrNull()?.stackTraceToString() ?: "Discovery and account verified")
        }
        finish(if (result.isSuccess) Activity.RESULT_OK else Activity.RESULT_CANCELED, response)
    }

    private fun View.findText(label: String): TextView? {
        if (this is TextView && isShown && text.toString() == label) return this
        if (this is ViewGroup) {
            for (index in 0 until childCount) {
                getChildAt(index).findText(label)?.let { return it }
            }
        }
        return null
    }
}
