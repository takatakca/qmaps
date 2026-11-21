import SwiftUI

@main
struct QmapsApp: App {
    @StateObject private var session = Session()
    var body: some Scene {
        WindowGroup {
            TabView {
                NavigationStack { PlacesView() }.tabItem { Label("Découvrir", systemImage: "location.magnifyingglass") }
                NavigationStack { PlacesView(saved: true) }.tabItem { Label("Favoris", systemImage: "bookmark") }
                NavigationStack { MerchantView() }.tabItem { Label("Commerce", systemImage: "storefront") }
                NavigationStack { AccountView() }.tabItem { Label("Compte", systemImage: "person.crop.circle") }
            }
            .environmentObject(session)
            .tint(Color(red: 0.08, green: 0.32, blue: 0.66))
        }
    }
}
