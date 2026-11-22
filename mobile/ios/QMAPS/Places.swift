import SwiftUI

struct PlacesView: View {
    @EnvironmentObject var session: Session
    var saved = false
    @State private var list: [Place] = []
    @State private var search = ""
    @State private var city = ""
    @State private var latestRequest = 0
    @State private var message = ""
    @State private var busy = false
    var body: some View {
        List {
            if !saved {
                Section {
                    TextField("Nom du commerce", text: $search)
                    TextField("Ville", text: $city)
                        .textContentType(.addressCity)
                    Button("Rechercher") { Task { await load() } }
                }
                .onSubmit { Task { await load() } }
            }
            if busy { ProgressView() }
            if !message.isEmpty { Text(message).foregroundStyle(.secondary) }
            ForEach(list) { place in
                NavigationLink { PlaceView(place: place) } label: {
                    VStack(alignment: .leading, spacing: 6) { Text(place.name).font(.headline); Text(place.city).foregroundStyle(.secondary) }
                }
            }
        }
        .navigationTitle(saved ? "Mes favoris" : "QMAPS")
        .onAppear { Task { await load() } }
        .onChange(of: session.token) { _,_ in Task { await load() } }
        .refreshable { await load() }
    }
    @MainActor private func load() async {
        latestRequest += 1
        let requestID = latestRequest
        let token = session.token
        if saved && token == nil {
            list = []
            busy = false
            message = "Connectez-vous dans Compte pour voir vos favoris."
            return
        }
        busy = true
        defer { if requestID == latestRequest { busy = false } }
        let filters = [
            URLQueryItem(name: "q", value: search.trimmingCharacters(in: .whitespacesAndNewlines)),
            URLQueryItem(name: "city", value: city.trimmingCharacters(in: .whitespacesAndNewlines))
        ]
        do {
            let results: [Place] = try await session.request(saved ? "me/bookmarks" : "places", query: saved ? [] : filters)
            guard requestID == latestRequest, token == session.token else { return }
            list = results
            message = results.isEmpty ? "Aucun commerce." : ""
        } catch {
            guard requestID == latestRequest, token == session.token else { return }
            list = []
            message = error.localizedDescription
        }
    }
}

struct PlaceView: View {
    @EnvironmentObject var session: Session
    let place: Place
    @State private var detail: Place?
    @State private var stories: [Story] = []
    @State private var settings: Settings?
    @State private var guest = ""
    @State private var party = 2
    @State private var reportSubject = ""
    @State private var reportDetails = ""
    @State private var blockConfirmation = false
    @Environment(\.dismiss) private var dismiss
    @State private var message = ""
    @State private var working = false
    var body: some View {
        Form {
            Section {
                Text(place.name).font(.title2.bold()); Text(place.city)
                if let address = detail?.address { Text(address) }
                if let desc = detail?.description { Text(desc) }
                Button("Enregistrer dans mes favoris") { Task { await change("bookmark", method: "PUT") } }.disabled(working)
            }
            Section("Signalement et blocage") {
                Button("Signaler la fiche") { reportSubject = "business"; reportDetails = "" }
                if detail?.can_block == true {
                    Button("Signaler l’éditeur") { reportSubject = "user"; reportDetails = "" }
                    Button("Bloquer cet éditeur", role: .destructive) { blockConfirmation = true }
                }
                if !reportSubject.isEmpty {
                    TextField("Décrivez le problème", text:$reportDetails, axis:.vertical)
                    Button("Envoyer le signalement") { Task {
                        if await change("report", method:"POST", payload:["subject":reportSubject,"details":reportDetails]) {
                            reportSubject = ""; reportDetails = ""
                        }
                    } }.disabled(working || reportDetails.trimmingCharacters(in:.whitespacesAndNewlines).count < 3)
                }
            }
            if !stories.isEmpty {
                Section("Actualités") { ForEach(stories) { s in VStack(alignment: .leading) { Text(s.title).font(.headline); Text(s.body) } } }
            }
            if settings?.waitlist == true {
                Section("Liste d’attente") {
                    TextField("Nom pour l’accueil", text: $guest)
                    Stepper("Personnes · " + String(party), value: $party, in: 1...30)
                    Button("Joindre la liste d’attente") { Task { await change("waitlist", method: "POST", payload: ["name":guest,"party_size":party]) } }.disabled(working || guest.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            if !message.isEmpty { Text(message).accessibilityLabel(message) }
        }.confirmationDialog("Masquer les fiches de cet éditeur?", isPresented:$blockConfirmation) {
            Button("Bloquer", role:.destructive) { Task {
                if await change("block-publisher", method:"PUT") { dismiss() }
            } }
        }.navigationTitle("Fiche du commerce").task {
            do {
                detail = try await session.request("places/" + place.id)
                stories = try await session.request("places/" + place.id + "/posts")
                settings = try await session.request("places/" + place.id + "/guest-settings")
            } catch { message = error.localizedDescription }
        }
    }
    @discardableResult @MainActor private func change(_ action: String, method: String, payload: [String:Any]? = nil) async -> Bool {
        guard session.token != nil else { message = "Connectez-vous dans Compte."; return false }
        working = true; defer { working = false }
        do {
            let _: Empty = try await session.request("places/" + place.id + "/" + action, method: method, body: payload)
            message = action == "bookmark" ? "Fiche enregistrée" : action == "report" ? "Signalement transmis à la modération" : "Demande envoyée"
            return true
        } catch { message = error.localizedDescription; return false }
    }
}
