package ca.qmaps.mobile

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import org.json.JSONObject
import org.json.JSONTokener
import java.net.HttpURLConnection
import java.net.URL
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class SessionVault(context: Context) {
    private val values = context.getSharedPreferences("qmaps", Context.MODE_PRIVATE)
    private fun key(): SecretKey {
        val keystore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (keystore.getKey("qmaps-session", null) as? SecretKey)?.let { return it }
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").apply {
            init(KeyGenParameterSpec.Builder("qmaps-session", KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
        }.generateKey()
    }
    fun read(): String? = runCatching {
        val packed = values.getString("session", null)?.split(".") ?: return null
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, Base64.decode(packed[0], Base64.NO_WRAP)))
        String(cipher.doFinal(Base64.decode(packed[1], Base64.NO_WRAP)), Charsets.UTF_8)
    }.getOrNull()
    fun save(token: String?) {
        if (token == null) { values.edit().remove("session").apply(); return }
        val c = Cipher.getInstance("AES/GCM/NoPadding")
        c.init(Cipher.ENCRYPT_MODE, key())
        val packed = listOf(c.iv, c.doFinal(token.toByteArray())).joinToString(".") { Base64.encodeToString(it, Base64.NO_WRAP) }
        values.edit().putString("session", packed).apply()
    }
}
class ApiFailure(val status: Int, message: String, val json: Boolean = false) : Exception(message)

fun decodeApiFailure(status: Int, contentType: String?, body: String): ApiFailure {
    val jsonMime = contentType?.substringBefore(';')?.trim()?.equals("application/json", ignoreCase = true) == true
    val message = runCatching {
        val document = JSONTokener(body)
        val error = (document.nextValue() as? JSONObject)?.opt("error") as? String
        error?.takeIf { document.nextClean() == '\u0000' }
    }.getOrNull()
    return ApiFailure(status, message ?: "Service indisponible", jsonMime && message != null)
}

class QmapsApi(private val vault: SessionVault) {
    fun request(path: String, method: String = "GET", payload: JSONObject? = null): Any =
        requestForViewer(path, vault.read(), method, payload)

    fun requestForViewer(path: String, viewer: String?, method: String = "GET", payload: JSONObject? = null): Any {
        val conn = URL("https://qmaps.ca/api/v1/$path").openConnection() as HttpURLConnection
        try {
            conn.requestMethod = method
            conn.instanceFollowRedirects = false
            conn.connectTimeout = 12000
            conn.readTimeout = 16000
            viewer?.let { conn.setRequestProperty("Authorization","Bearer $it") }
            if (payload != null) {
                conn.doOutput = true
                conn.setRequestProperty("Content-Type","application/json")
                conn.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
            }
            val status = conn.responseCode
            if (status !in 200..299) {
                val error = conn.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
                throw decodeApiFailure(status, conn.contentType, error)
            }
            if (status == 204) return Unit
            return JSONTokener(conn.inputStream.bufferedReader().use { it.readText() }).nextValue()
        } finally { conn.disconnect() }
    }
}
