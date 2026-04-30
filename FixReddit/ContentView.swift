import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Fix Reddit")
                    .font(.largeTitle.weight(.semibold))

                Text("Enable the Safari extension, then open reddit.com in Safari. The extension redirects Reddit to old.reddit.com and applies a mobile layout.")
                    .font(.body)
                    .foregroundStyle(.secondary)

                Button {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                } label: {
                    Label("Open Settings", systemImage: "gear")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)

                VStack(alignment: .leading, spacing: 10) {
                    Text("Enable in Settings:")
                        .font(.headline)
                    Text("Safari > Extensions > FixReddit")
                    Text("Allow access for reddit.com and old.reddit.com when prompted.")
                }
                .font(.callout)
                .foregroundStyle(.secondary)

                Spacer()
            }
            .padding(24)
            .navigationTitle("Fix Reddit")
            .navigationBarTitleDisplayMode(.inline)
        }
        .navigationViewStyle(.stack)
    }
}
