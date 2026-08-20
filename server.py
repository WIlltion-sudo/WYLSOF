#!/usr/bin/env python3
"""
============================================================================
WYLSOF - Real-Time Backend Server & Google Sheets / Email Gateway
============================================================================
Runs a local or cloud web server (Render, Railway, Koyeb, VPS, etc.).
When inquiries are submitted, it:
1. Instantly forwards the lead to Google Apps Script Webhook (updates Google Sheets in real time)
2. Triggers real-time email alerts to wylsof1@gmail.com
3. Maintains a local redundant backup log (JSON & CSV)
============================================================================
"""

import http.server
import socketserver
import json
import csv
import os
import urllib.request
import urllib.parse
from datetime import datetime

# Port for local or cloud hosting (Render/Railway/Heroku auto-assigns $PORT)
PORT = int(os.environ.get("PORT", 8000))
CSV_FILE = "customer_inquiries.csv"
JSON_FILE = "customer_inquiries.json"

# Deployed Google Apps Script Web App URL (Paste your URL here or set APPS_SCRIPT_WEBHOOK_URL env var)
APPS_SCRIPT_WEBHOOK_URL = os.environ.get("APPS_SCRIPT_WEBHOOK_URL", "https://script.google.com/macros/s/AKfycbzv0DVFSUBtS_RDXXo1t6MX6Z2SQp90GUckyDzpHL9oBwiGaH1OwZebf9I7zx-FVrgm/exec")

# Target Google Sheet Info
SPREADSHEET_ID = "1uPSQnSPHqxdXyKL314V-R8M-igeRqd4VU4Xe4K6txLU"
SPREADSHEET_URL = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit"
ADMIN_EMAIL = "wylsof1@gmail.com"

# Initialize CSV file with headers if not existing
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            "Timestamp", "Reference ID", "Full Name", "Email Address",
            "Company / Organization", "Service Requested", "Target Timeline",
            "Project Requirements", "Status"
        ])

def forward_to_google_sheets(payload):
    """Forwards lead data to Google Apps Script Webhook to update Google Sheets in real time"""
    if not APPS_SCRIPT_WEBHOOK_URL or not APPS_SCRIPT_WEBHOOK_URL.startswith("http"):
        return {"status": "skipped", "reason": "APPS_SCRIPT_WEBHOOK_URL not configured yet"}
    
    try:
        data_json = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            APPS_SCRIPT_WEBHOOK_URL,
            data=data_json,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = response.read().decode('utf-8')
            return {"status": "success", "response": res_data}
    except Exception as e:
        print(f"[!] Note on Google Sheets Webhook forwarding: {e}")
        # Try GET fallback
        try:
            params = urllib.parse.urlencode(payload)
            get_url = f"{APPS_SCRIPT_WEBHOOK_URL}?${params}"
            with urllib.request.urlopen(get_url, timeout=10) as response:
                res_data = response.read().decode('utf-8')
                return {"status": "success", "response": res_data}
        except Exception as e2:
            return {"status": "error", "error": str(e2)}

class WylsofHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path in ["/api/inquire", "/inquire"]:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
            except Exception:
                data = {}

            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            ref_id = data.get("referenceId", f"WYL-2026-{int(datetime.now().timestamp()) % 10000}")
            name = data.get("name", data.get("Client_Name", "Direct Client"))
            email = data.get("email", data.get("Email_Address", ""))
            company = data.get("company", data.get("Company_Name", "Not Specified"))
            service = data.get("projectType", data.get("Service_Requested", "General Consultation"))
            timeline = data.get("timeline", data.get("Desired_Timeline", "Not Specified"))
            requirements = data.get("requirements", data.get("Project_Requirements", ""))
            status = "New Lead"

            payload = {
                "timestamp": now,
                "referenceId": ref_id,
                "name": name,
                "email": email,
                "company": company,
                "projectType": service,
                "timeline": timeline,
                "requirements": requirements,
                "status": status
            }

            # 1. Forward directly to Google Sheets & Email Webhook
            webhook_res = forward_to_google_sheets(payload)

            # 2. Append to local CSV database as backup
            try:
                with open(CSV_FILE, mode='a', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow([now, ref_id, name, email, company, service, timeline, requirements, status])
            except Exception as e:
                print(f"[!] CSV write error: {e}")

            # 3. Append to local JSON database as backup
            all_records = []
            if os.path.exists(JSON_FILE):
                try:
                    with open(JSON_FILE, mode='r', encoding='utf-8') as f:
                        all_records = json.load(f)
                except Exception:
                    all_records = []
            
            all_records.insert(0, payload)

            try:
                with open(JSON_FILE, mode='w', encoding='utf-8') as f:
                    json.dump(all_records, f, indent=2)
            except Exception as e:
                print(f"[!] JSON write error: {e}")

            print("="*60)
            print(f" [WYLSOF] NEW LEAD RECORDED IN REAL TIME")
            print(f" -> Reference ID:   {ref_id}")
            print(f" -> Client Name:    {name}")
            print(f" -> Client Email:   {email}")
            print(f" -> Service:        {service}")
            print(f" -> Target Timeline:{timeline}")
            print(f" -> Google Sheets:  {SPREADSHEET_URL}")
            print(f" -> Alert Sent To:  {ADMIN_EMAIL}")
            print(f" -> Sync Status:    {webhook_res.get('status')}")
            print("="*60)

            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                "status": "success",
                "referenceId": ref_id,
                "message": "Inquiry recorded in real-time database and dispatched.",
                "webhook": webhook_res
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_error(404, "Endpoint not found")

    def do_GET(self):
        if self.path == "/api/inquiries":
            all_records = []
            if os.path.exists(JSON_FILE):
                try:
                    with open(JSON_FILE, mode='r', encoding='utf-8') as f:
                        all_records = json.load(f)
                except Exception:
                    all_records = []
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(all_records).encode('utf-8'))
        elif self.path == "/api/status":
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            status_data = {
                "server": "online",
                "spreadsheetUrl": SPREADSHEET_URL,
                "adminEmail": ADMIN_EMAIL,
                "webhookConfigured": bool(APPS_SCRIPT_WEBHOOK_URL)
            }
            self.wfile.write(json.dumps(status_data).encode('utf-8'))
        else:
            # Serve regular static files
            super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Accept')
        self.end_headers()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print("==================================================")
    print(f"  🚀 WYLSOF REAL-TIME SERVER STARTED (PORT {PORT})")
    print(f"  Access Website:   http://localhost:{PORT}")
    print(f"  Google Sheet:     {SPREADSHEET_URL}")
    print(f"  Lead Alerts:      {ADMIN_EMAIL}")
    print("==================================================")
    with socketserver.TCPServer(("0.0.0.0", PORT), WylsofHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
