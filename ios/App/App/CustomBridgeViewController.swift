import UIKit
import WebKit
import Capacitor

class CustomBridgeViewController: CAPBridgeViewController, WKUIDelegate {

    override func viewDidLoad() {
        super.viewDidLoad()

            webView?.uiDelegate = self
    }

    @available(iOS 15.0, *)
    func webView(
        _ webView: WKWebView,
        requestMediaCapturePermissionFor origin: WKSecurityOrigin,
        initiatedByFrame frame: WKFrameInfo,
        type: WKMediaCaptureType,
        decisionHandler: @escaping (WKPermissionDecision) -> Void
    ) {
        if origin.host == "www.practcoach.com" {
            decisionHandler(.grant)
        } else {
            decisionHandler(.prompt)
        }
    }
}