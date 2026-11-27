import SwiftUI

@MainActor
struct PlacesView: View {
    var saved = false
    var body: some View {
        if saved { SavedPlacesView() } else { DirectoryPlacesView() }
    }
}

@MainActor
private func placeLink(_ place: Place) -> some View {
    NavigationLink { PlaceView(place: place) } label: {
        VStack(alignment: .leading, spacing: 6) {
            Text(place.name).font(.headline)
            Text(place.city).foregroundStyle(.secondary)
        }
    }
}

@MainActor
private struct DirectoryPlacesView: View {
    private enum Phase: Equatable { case ready, loading, firstFailure, moreFailure, restart }

    @EnvironmentObject var session: Session
    @State private var pages = DirectoryPages()
    @State private var search = ""
    @State private var city = ""
    @State private var applied: DirectoryFilters?
    @State private var viewer: String?
    @State private var generation = 0
    @State private var work: Task<Void, Never>?
    @State private var phase: Phase = .ready
    @State private var message = ""

    var body: some View {
        List {
            Section {
                TextField("Nom du commerce", text: $search)
                TextField("Ville", text: $city).textContentType(.addressCity)
                Button("Rechercher") { start(typedFilters) }
            }.onSubmit { start(typedFilters) }
            if phase == .loading { ProgressView() }
            if !message.isEmpty { Text(message).foregroundStyle(.secondary) }
            if viewer == session.token {
                ForEach(pages.items) { placeLink($0) }
                switch phase {
                case .ready:
                    if pages.next != nil { Button("Voir plus", action: more) }
                case .firstFailure:
                    Button("Réessayer", action: restart)
                case .moreFailure:
                    Button("Réessayer", action: more)
                case .restart:
                    Button("Relancer la recherche", action: restart)
                case .loading:
                    EmptyView()
                }
            }
        }
        .navigationTitle("QMAPS")
        .onAppear {
            if applied == nil { start(typedFilters) }
            else if viewer != session.token { invalidateViewer() }
        }
        .onChange(of: session.token) { _, _ in
            if viewer != session.token { invalidateViewer() }
        }
        .refreshable { await refresh() }
    }

    private var typedFilters: DirectoryFilters { DirectoryFilters(name: search, city: city) }

    private func restart() { start(applied ?? typedFilters) }

    private func refresh() async {
        restart()
        await work?.value
    }

    private func start(_ filters: DirectoryFilters) {
        work?.cancel()
        work = nil
        generation += 1
        applied = filters
        viewer = session.token
        pages = DirectoryPages()
        guard filters.isValid else {
            message = "Le nom du commerce est limité à 150 caractères et la ville à 120 caractères."
            phase = .ready
            return
        }
        request(filters, after: nil)
    }

    private func more() {
        guard phase == .ready || phase == .moreFailure, let filters = applied,
              let cursor = pages.next, viewer == session.token else { return }
        request(filters, after: cursor)
    }

    private func request(_ filters: DirectoryFilters, after: String?) {
        generation += 1
        let ticket = generation
        let expectedViewer = viewer
        phase = .loading
        message = ""
        work = Task {
            guard ticket == generation, expectedViewer == session.token, !Task.isCancelled else { return }
            do {
                let reply = try await session.directoryPage(filters, after: after)
                guard ticket == generation, expectedViewer == session.token, !Task.isCancelled else { return }
                switch reply {
                case .page(let page): try pages.append(page)
                case .legacy(let rows): pages.replaceWithLegacy(rows)
                }
                phase = .ready
                if pages.legacyCapped {
                    message = "Les 100 premiers résultats sont affichés. Affinez la recherche pour trouver un commerce précis."
                } else if pages.items.isEmpty {
                    message = pages.next == nil ? "Aucun commerce." : "Aucun commerce sur cette page."
                }
            } catch {
                guard ticket == generation, !Task.isCancelled else { return }
                let status = (error as? APIHTTPError)?.status
                if expectedViewer != session.token || (after != nil && (status == 401 || status == 409)) {
                    invalidateViewer()
                } else if error is DirectoryPageError {
                    phase = .restart
                    message = "La suite des résultats est indisponible."
                } else {
                    phase = after == nil ? .firstFailure : .moreFailure
                    message = error is DecodingError ? "Réponse de l’annuaire invalide." : error.localizedDescription
                }
            }
        }
    }

    private func invalidateViewer() {
        work?.cancel()
        work = nil
        generation += 1
        viewer = session.token
        pages = DirectoryPages()
        phase = .restart
        message = "La recherche a expiré."
    }
}

@MainActor
private struct SavedPlacesView: View {
    @EnvironmentObject var session: Session
    @State private var list: [Place] = []
    @State private var latestRequest = 0
    @State private var message = ""
    @State private var busy = false
    var body: some View {
        List {
            if busy { ProgressView() }
            if !message.isEmpty { Text(message).foregroundStyle(.secondary) }
            ForEach(list) { placeLink($0) }
        }
        .navigationTitle("Mes favoris")
        .onAppear { Task { await load() } }
        .onChange(of: session.token) { _,_ in Task { await load() } }
        .refreshable { await load() }
    }
    @MainActor private func load() async {
        latestRequest += 1
        let requestID = latestRequest
        let token = session.token
        if token == nil {
            list = []
            busy = false
            message = "Connectez-vous dans Compte pour voir vos favoris."
            return
        }
        busy = true
        defer { if requestID == latestRequest { busy = false } }
        do {
            let results: [Place] = try await session.request("me/bookmarks")
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
            if let reference = detail?.attributes?.reference {
                Section("Fiche de source municipale") {
                    Link("Ville de Montréal, « Établissements alimentaires »", destination: MunicipalListingCredit.sourceURL)
                    Text("Référence municipale \(reference)")
                    Link("CC BY 4.0", destination: MunicipalListingCredit.licenceURL)
                    Text("Adaptation par FLEXS et QMAPS. Les horaires et l’exploitant actuel ne sont pas confirmés.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
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
