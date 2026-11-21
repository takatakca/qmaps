import SwiftUI

struct AccountView: View {
    @EnvironmentObject var session: Session
    @State private var handle = ""
    @State private var password = ""
    @State private var code = ""
    @State private var issued = ""
    @State private var message = ""
    @State private var loading = false
    var body: some View {
        Form {
            if !issued.isEmpty {
                Section("Code de récupération à conserver") {
                    Text(issued).font(.system(.body, design: .monospaced)).textSelection(.enabled)
                    Button("J’ai enregistré le code") { issued = "" }
                }
            }
            if session.token == nil {
                Section("Compte QMAPS") {
                    TextField("Identifiant", text: $handle).textInputAutocapitalization(.never).autocorrectionDisabled()
                    SecureField("Mot de passe (12 caractères minimum)", text: $password)
                    Button("Se connecter") { Task { await submit("login") } }
                    Button("Créer un compte") { Task { await submit("register") } }
                }
                Section("Récupération") {
                    SecureField("Code de récupération", text: $code)
                    Button("Remplacer le mot de passe") { Task { await submit("recover") } }
                }
            } else {
                NavigationLink("Éditeurs bloqués") { BlockedPublisherView() }
                Button("Se déconnecter") {
                    Task { do { let _: Empty = try await session.request("accounts/logout", method:"POST"); try session.apply(nil); issued = ""; message = "" }
                        catch { message = error.localizedDescription } }
                }
            }
            Section("Confidentialité") {
                Link("Supprimer mon compte QMAPS", destination: URL(string: "https://qmaps.ca/compte/fermeture")!)
            }
            if loading { ProgressView() }
            if !message.isEmpty { Text(message) }
        }.navigationTitle("Mon compte").disabled(loading)
    }
    @MainActor private func submit(_ mode:String) async {
        loading = true; defer { loading = false }
        var data: [String:Any] = ["handle":handle, "password":password]
        if mode == "recover" { data["recovery_code"] = code }
        do {
            let result: AccountResult = try await session.request("accounts/"+mode, method:"POST",body:data)
            try session.apply(result.token); issued = result.recovery_code ?? ""; message = "Connecté · " + result.handle
            password = ""; code = ""
        } catch { message = error.localizedDescription }
    }
}

struct BlockedPublisherView: View {
    @EnvironmentObject var session: Session
    @State private var entries: [BlockedPublisher] = []
    @State private var message = ""
    var body: some View {
        List {
            if entries.isEmpty { Text("Aucun éditeur bloqué.") }
            ForEach(entries) { row in
                Button("Débloquer · " + row.label) { Task {
                    do { let _:Empty = try await session.request("me/blocked-publishers/"+row.id,method:"DELETE"); await load() }
                    catch {message=error.localizedDescription}
                } }
            }
            if !message.isEmpty {Text(message)}
        }.navigationTitle("Éditeurs bloqués").task {await load()}
    }
    @MainActor private func load() async {
        do {entries = try await session.request("me/blocked-publishers")} catch {message=error.localizedDescription}
    }
}

struct MerchantView: View {
    @EnvironmentObject var session: Session
    @State private var owned: [Place] = []
    @State private var rules: PublisherTerms?
    @State private var name = ""
    @State private var city = ""
    @State private var address = ""
    @State private var message = ""
    @State private var working = false
    var body: some View {
        Form {
            if session.token == nil { Text("Connectez-vous dans Compte pour accéder à votre espace commerçant.") }
            else if let rules, !rules.accepted {
                Link("Lire les conditions de publication", destination:URL(string:"https://qmaps.ca/terms")!)
                Button("J’accepte les conditions de publication") { Task {
                    do {
                        let _:PublisherTerms = try await session.request("me/publication-terms",method:"PUT",body:["version":rules.version])
                        await reload()
                    } catch {message=error.localizedDescription}
                } }
            } else if rules?.accepted == true {
                Section("Créer ma fiche") {
                    TextField("Nom du commerce",text:$name); TextField("Ville",text:$city); TextField("Adresse",text:$address)
                    Button("Créer ma fiche") { Task { await create() } }.disabled(working)
                }
                Section("Mes commerces") {
                    ForEach(owned) { place in NavigationLink(place.name) { PublishView(place: place) } }
                }
            }
            if !message.isEmpty { Text(message) }
        }.navigationTitle("Commerce").task(id:session.token) { await reload() }
    }
    @MainActor private func reload() async {
        guard session.token != nil else {owned=[]; rules=nil; return}
        do { rules = try await session.request("me/publication-terms"); owned = try await session.request("me/places") } catch { message=error.localizedDescription }
    }
    @MainActor private func create() async {
        working=true; defer {working=false}
        do { let _:Empty = try await session.request("places",method:"POST",body:["name":name,"city":city,"address":address])
            name="";city="";address="";message="Fiche créée";await reload()
        } catch {message=error.localizedDescription}
    }
}
struct PublishView: View {
    @EnvironmentObject var session: Session
    let place: Place
    @State private var title = ""
    @State private var text = ""
    @State private var message = ""
    @State private var working=false
    var body: some View {
        Form {
            Section(place.name) { TextField("Titre de l’actualité",text:$title); TextField("Texte de l’actualité",text:$text,axis:.vertical) }
            Button("Publier l’actualité") { Task {
                working=true;defer {working=false}
                do { let _:Empty = try await session.request("places/"+place.id+"/posts",method:"POST",body:["title":title,"body":text]);message="Actualité publiée";title="";text="" }
                catch { message=error.localizedDescription }
            } }.disabled(working)
            if !message.isEmpty {Text(message)}
        }.navigationTitle("Actualité")
    }
}
