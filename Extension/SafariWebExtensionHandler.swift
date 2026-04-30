import SafariServices
import os.log

final class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let response = NSExtensionItem()

        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [SFExtensionMessageKey: ["ok": true]]
        } else {
            response.userInfo = ["message": ["ok": true]]
        }

        os_log(.debug, "FixReddit Safari extension received native message")
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
