package ca.qmaps.mobile

import android.app.Activity
import android.app.AlertDialog
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.text.InputType
import android.view.View
import android.widget.*
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.Executors

class MainActivity : Activity() {
    private val worker = Executors.newSingleThreadExecutor()
    private lateinit var vault: SessionVault
    private lateinit var api: QmapsApi
    private lateinit var content: LinearLayout
    private lateinit var status: TextView
    private var screen = "Découvrir"
    private var epoch = 0
    private var pending = false
    private var search = ""
    private val navy = Color.rgb(19,40,69)
    private val blue = Color.rgb(26,89,172)
    private fun dp(v:Int) = (resources.displayMetrics.density*v).toInt()
    override fun onCreate(state:Bundle?) {
        super.onCreate(state)
        vault = SessionVault(this)
        api = QmapsApi(vault)
        show("Découvrir")
    }
    override fun onDestroy() { epoch++; worker.shutdownNow(); super.onDestroy() }
    @Deprecated("System compatibility")
    override fun onBackPressed() { if(screen!="Découvrir") show("Découvrir") else super.onBackPressed() }
    private fun label(value:String, size:Float=16f, bold:Boolean=false) = TextView(this).apply {
        text=value; textSize=size; setTextColor(navy); setPadding(0,dp(6),0,dp(6))
        if(bold) setTypeface(typeface,Typeface.BOLD)
    }
    private fun action(title:String, fn:()->Unit) = Button(this).apply {
        text=title; isAllCaps=false; setTextColor(blue)
        setOnClickListener { if(!pending) fn() }
    }
    private fun input(hintText:String, secret:Boolean=false) = EditText(this).apply {
        hint=hintText; isSingleLine=true; contentDescription=hintText
        if(secret) inputType=InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        content.addView(this)
    }
    private fun shell(title:String) {
        epoch++; pending=false
        val root=LinearLayout(this).apply { orientation=LinearLayout.VERTICAL; setBackgroundColor(Color.rgb(249,250,252)) }
        root.setOnApplyWindowInsetsListener { v,i -> v.setPadding(i.systemWindowInsetLeft,i.systemWindowInsetTop,i.systemWindowInsetRight,i.systemWindowInsetBottom);i }
        val header=label("QMAPS",26f,true).apply { setTextColor(Color.WHITE);setBackgroundColor(navy);setPadding(dp(20),dp(12),dp(20),dp(12)) }
        root.addView(header)
        val tabs=HorizontalScrollView(this).apply { isHorizontalScrollBarEnabled=false }
        val items=LinearLayout(this)
        for(t in listOf("Découvrir","Favoris","Commerce","Compte")) items.addView(action(t){show(t)})
        tabs.addView(items);root.addView(tabs)
        val scroll=ScrollView(this)
        content=LinearLayout(this).apply { orientation=LinearLayout.VERTICAL;setPadding(dp(18),dp(10),dp(18),dp(24)) }
        scroll.addView(content);root.addView(scroll)
        content.addView(label(title,24f,true));status=label("",14f).also(content::addView)
        setContentView(root)
    }
    private fun run(call:()->Any, done:(Any)->Unit) {
        val ticket=epoch;pending=true;status.text="Chargement…"
        worker.submit {
            val result=runCatching(call)
            runOnUiThread {
                if(isDestroyed||ticket!=epoch)return@runOnUiThread
                pending=false;status.text=""
                result.onSuccess(done).onFailure { error ->
                    if(error is ApiFailure&&error.status==401&&vault.read()!=null) vault.save(null)
                    status.text=error.message ?: "Connexion impossible"
                }
            }
        }
    }
    private fun show(tab:String) {
        screen=tab;shell(tab)
        when(tab) {
            "Découvrir"->catalogue()
            "Compte"->account()
            "Favoris"->if(signed()) run({api.request("me/bookmarks")}){cards(it as JSONArray)}
            "Commerce"->if(signed()) merchant()
        }
    }
    private fun signed():Boolean {
        if(vault.read()!=null)return true
        content.addView(label("Connectez-vous pour accéder à cet espace."))
        content.addView(action("Ouvrir mon compte"){show("Compte")});return false
    }
    private fun catalogue() {
        val term=input("Nom du commerce");term.setText(search)
        content.addView(action("Rechercher"){search=term.text.toString();show("Découvrir")})
        run({api.request("places?q="+Uri.encode(search))}){cards(it as JSONArray)}
    }
    private fun cards(rows:JSONArray) {
        if(rows.length()==0)content.addView(label("Aucun commerce."))
        for(i in 0 until rows.length()) {
            val row=rows.getJSONObject(i)
            val card=LinearLayout(this).apply {
                orientation=LinearLayout.VERTICAL;setPadding(dp(12),dp(8),dp(12),dp(8))
                background=GradientDrawable().apply{setColor(Color.WHITE);cornerRadius=dp(10).toFloat();setStroke(dp(1),Color.LTGRAY)}
                addView(label(row.getString("name"),18f,true));addView(label(row.optString("city"),14f))
                setOnClickListener { detail(row.getString("id")) }
                isFocusable=true
            }
            val params=LinearLayout.LayoutParams(-1,-2).apply{bottomMargin=dp(8)}
            content.addView(card,params)
        }
    }
    private fun detail(id:String) {
        screen="Fiche";shell("Fiche du commerce")
        run({api.request("places/$id")}) { result ->
            val row=result as JSONObject
            content.addView(label(row.getString("name"),22f,true))
            content.addView(label(row.getString("city")+" · "+row.getString("address")))
            if(!row.isNull("description"))content.addView(label(row.getString("description")))
            content.addView(action("Enregistrer dans mes favoris"){
                if(vault.read()==null)show("Compte") else run({api.request("places/$id/bookmark","PUT")}){status.text="Fiche enregistrée"}
            })
            run({api.request("places/$id/guest-settings")}) { settings ->
                if((settings as JSONObject).optBoolean("waitlist")) {
                    val nom=input("Nom pour l’accueil");val groupe=input("Nombre de personnes");groupe.inputType=InputType.TYPE_CLASS_NUMBER;groupe.setText("2")
                    content.addView(action("Joindre la liste d’attente"){
                        if(vault.read()==null)show("Compte") else {
                            val data=JSONObject().put("name",nom.text.toString()).put("party_size",groupe.text.toString().toIntOrNull() ?: 0)
                            run({api.request("places/$id/waitlist","POST",data)}){status.text="Demande envoyée"}
                        }
                    })
                }
            }
        }
    }
    private fun account() {
        if(vault.read()!=null) {
            content.addView(action("Se déconnecter"){
                run({api.request("accounts/logout","POST")}){vault.save(null);show("Compte")}
            })
            run({api.request("me")}){status.text="Connecté · "+(it as JSONObject).getString("handle")}
            return
        }
        val user=input("Identifiant");val pass=input("Mot de passe (12 caractères minimum)",true)
        fun submit(mode:String, recovery:String?=null) {
            val data=JSONObject().put("handle",user.text.toString()).put("password",pass.text.toString())
            if(recovery!=null)data.put("recovery_code",recovery)
            run({api.request("accounts/$mode","POST",data)}) {
                val dto=it as JSONObject;vault.save(dto.getString("token"));show("Compte")
                if(dto.has("recovery_code")) {
                    val code=label(dto.getString("recovery_code")).apply{setTextIsSelectable(true);setPadding(dp(16),dp(8),dp(16),dp(8))}
                    AlertDialog.Builder(this).setTitle("Conservez votre code de récupération").setView(code).setPositiveButton("J’ai enregistré le code",null).show()
                }
            }
        }
        content.addView(action("Se connecter"){submit("login")});content.addView(action("Créer un compte"){submit("register")})
        val recovery=input("Code de récupération",true);content.addView(action("Remplacer le mot de passe"){submit("recover",recovery.text.toString())})
    }
    private fun merchant() {
        val name=input("Nom du commerce");val city=input("Ville");val address=input("Adresse")
        content.addView(action("Créer ma fiche"){
            val data=JSONObject().put("name",name.text.toString()).put("city",city.text.toString()).put("address",address.text.toString())
            run({api.request("places","POST",data)}){show("Commerce")}
        })
        run({api.request("me/places")}) { result ->
            val rows=result as JSONArray
            for(i in 0 until rows.length()) {
                val row=rows.getJSONObject(i)
                content.addView(label(row.getString("name"),20f,true))
                val title=input("Titre de l’actualité");val message=input("Texte de l’actualité")
                content.addView(action("Publier l’actualité"){
                    val data=JSONObject().put("title",title.text.toString()).put("body",message.text.toString())
                    run({api.request("places/"+row.getString("id")+"/posts","POST",data)}){status.text="Actualité publiée"}
                })
            }
        }
    }
}
