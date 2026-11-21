package ca.qmaps.mobile.test

import android.app.Activity
import android.app.Instrumentation
import android.content.Intent
import android.os.Bundle
import android.os.SystemClock
import android.graphics.Bitmap
import java.io.File
import ca.qmaps.mobile.R
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
                val root = activity.window.decorView
                awaitScreen("Catalogue chargé") {
                    root.findViewById<View>(R.id.catalogue_place)?.isShown == true
                }
                capture("accueil")
                onUi {
                    check(root.findText("Rechercher") != null)
                    check(root.findViewById<View>(R.id.catalogue_place).performClick())
                }
                awaitScreen("Fiche chargée") {
                    root.findText("Enregistrer dans mes favoris") != null &&
                        root.findText("Chargement…") == null
                }
                capture("fiche")
                onUi { check(checkNotNull(root.findText("Compte")).performClick()) }
                awaitScreen("Compte") {
                    root.findText("Se connecter") != null &&
                        root.findText("Supprimer mon compte QMAPS") != null
                }
                capture("compte")
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

    private fun <T> onUi(operation: () -> T): T {
        var result: Result<T>? = null
        runOnMainSync { result = runCatching(operation) }
        return checkNotNull(result).getOrThrow()
    }

    private fun awaitScreen(name: String, ready: () -> Boolean) {
        val deadline = SystemClock.elapsedRealtime() + 45000
        while (SystemClock.elapsedRealtime() < deadline) {
            if (onUi(ready)) {
                waitForIdleSync()
                return
            }
            SystemClock.sleep(200)
        }
        error("Écran non chargé : $name")
    }

    private fun capture(name: String) {
        val shot = checkNotNull(uiAutomation.takeScreenshot()) { "Capture impossible : $name" }
        try {
            File(targetContext.cacheDir, "qmaps-$name.png").outputStream().use {
                check(shot.compress(Bitmap.CompressFormat.PNG, 100, it))
            }
        } finally { shot.recycle() }
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
