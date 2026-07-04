#!/usr/bin/env python3
"""職安練習用的靜態伺服器：強制不快取，確保平板／手機每次都拿到最新檔。"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def guess_type(self, path):
        if path.endswith(".js") or path.endswith(".mjs"):
            return "text/javascript; charset=utf-8"
        if path.endswith(".svg"):
            return "image/svg+xml; charset=utf-8"
        return super().guess_type(path)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = ThreadingHTTPServer(("0.0.0.0", port), NoCacheHandler)
    print(f"Serving (no-cache) on http://0.0.0.0:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    main()
