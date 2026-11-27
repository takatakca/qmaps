package ca.qmaps.mobile.test

import android.app.Activity
import android.app.Instrumentation
import android.content.Intent
import android.os.Bundle
import android.os.SystemClock
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import android.graphics.Bitmap
import java.io.File
import java.text.Normalizer
import ca.qmaps.mobile.R
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
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
            verifyMunicipalCredit()
            verifyDirectoryPages()
            val launch = Intent(targetContext, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            val activity = startActivitySync(launch)
            try {
                val root = activity.window.decorView
                awaitScreen("Catalogue chargé") {
                    root.findViewById<View>(R.id.catalogue_place)?.isShown == true && root.findText("Chargement…") == null
                }
                fun searchCity(value: String) = onUi {
                    val field = checkNotNull(root.findViewWithTag<EditText>("qmaps-city-search"))
                    field.setText(value)
                    check(checkNotNull(root.findText("Rechercher")).performClick())
                }
                searchCity("Qmaps-ville-inexistante-zz")
                awaitScreen("Aucun commerce dans cette ville") {
                    root.findText("Aucun commerce.") != null && root.findViewById<View>(R.id.catalogue_place) == null
                }
                searchCity("  Montreal  ")
                awaitScreen("Résultats de Montréal") {
                    val first = root.findViewById<View>(R.id.catalogue_place)
                    val results = first?.parent as? ViewGroup ?: return@awaitScreen false
                    val cards = (0 until results.childCount).map(results::getChildAt)
                        .filter { it.id == R.id.catalogue_place }
                    cards.isNotEmpty() && cards.all { card ->
                        val label = (card as ViewGroup).getChildAt(1) as TextView
                        val city = Normalizer.normalize(label.text, Normalizer.Form.NFD)
                            .replace(Regex("\\p{M}+"), "")
                        city.equals("Montreal", ignoreCase = true)
                    } && root.findText("Chargement…") == null
                }
                searchCity("")
                awaitScreen("Retour au catalogue") {
                    root.findViewById<View>(R.id.catalogue_place)?.isShown == true && root.findText("Chargement…") == null
                }
                capture(activity, "accueil")
                onUi {
                    check(root.findText("Rechercher") != null)
                    check(root.findViewById<View>(R.id.catalogue_place).performClick())
                }
                awaitScreen("Fiche chargée") {
                    root.findText("Enregistrer dans mes favoris") != null &&
                        root.findText("Chargement…") == null
                }
                capture(activity, "fiche")
                onUi { check(checkNotNull(root.findText("Compte")).performClick()) }
                awaitScreen("Compte") {
                    root.findText("Se connecter") != null &&
                        root.findText("Supprimer mon compte QMAPS") != null
                }
                capture(activity, "compte")
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

    private fun capture(activity: Activity, name: String) {
        val window = activity.window
        val root = window.decorView
        val shot = onUi { Bitmap.createBitmap(root.width, root.height, Bitmap.Config.ARGB_8888) }
        val ready = CountDownLatch(1)
        var result = PixelCopy.ERROR_UNKNOWN
        val handler = Handler(Looper.getMainLooper())
        try {
            // Read the QMAPS window after its new layout reaches the compositor.
            // Device launcher dialogs and notifications belong to other windows.
            onUi {
                root.postOnAnimation {
                    root.postOnAnimation {
                        PixelCopy.request(window, shot, { outcome ->
                            result = outcome
                            ready.countDown()
                        }, handler)
                    }
                }
            }
            check(ready.await(15, TimeUnit.SECONDS) && result == PixelCopy.SUCCESS) {
                "Capture de la fenêtre QMAPS impossible : $name ($result)"
            }
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
