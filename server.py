import http.server
import socketserver
import json
import os
import urllib.parse
import urllib.request
import base64
from datetime import datetime

PORT = 8000
DB_FILE = os.path.join(os.path.dirname(__file__), "data.json")

def read_db():
    if not os.path.exists(DB_FILE):
        return []
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading database: {e}")
        return []

def write_db(data):
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error writing database: {e}")
        return False

class DashboardRequestHandler(http.server.BaseHTTPRequestHandler):
    
    def log_message(self, format, *args):
        # Override to prevent logging clutter in terminal
        print(f"[{self.log_date_time_string()}] {format%args}")

    def send_json(self, data, status=200):
        try:
            response_bytes = json.dumps(data).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(response_bytes)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()
            self.wfile.write(response_bytes)
        except Exception as e:
            print(f"Error sending JSON response: {e}")

    def handle_cors_preflight(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self.handle_cors_preflight()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        # --- API Routes ---
        if path == "/api/items" or path == "/api/items/":
            items = read_db()
            self.send_json(items)
            return
            
        elif path.startswith("/api/items/"):
            # GET /api/items/<id>
            item_id = path.split("/")[-1]
            items = read_db()
            item = next((x for x in items if x["id"] == item_id), None)
            if item:
                self.send_json(item)
            else:
                self.send_json({"error": "Item not found"}, 404)
            return

        # --- Static File Serving ---
        # Default to index.html
        if path == "/" or path == "":
            file_path = "index.html"
        else:
            # Strip leading slash
            file_path = path.lstrip("/")
            
        # Secure file path to stay in current directory
        base_dir = os.path.dirname(os.path.abspath(__file__))
        target_path = os.path.abspath(os.path.join(base_dir, file_path))
        
        if not target_path.startswith(base_dir):
            self.send_error(403, "Access Forbidden")
            return

        if os.path.exists(target_path) and os.path.isfile(target_path):
            content_type = "text/plain"
            if target_path.endswith(".html"):
                content_type = "text/html; charset=utf-8"
            elif target_path.endswith(".css"):
                content_type = "text/css; charset=utf-8"
            elif target_path.endswith(".js"):
                content_type = "application/javascript; charset=utf-8"
            elif target_path.endswith(".json"):
                content_type = "application/json; charset=utf-8"
            elif target_path.endswith(".png"):
                content_type = "image/png"
            elif target_path.endswith(".jpg") or target_path.endswith(".jpeg"):
                content_type = "image/jpeg"
            elif target_path.endswith(".svg"):
                content_type = "image/svg+xml"

            try:
                with open(target_path, "rb") as f:
                    content_bytes = f.read()
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(content_bytes)))
                self.end_headers()
                self.wfile.write(content_bytes)
            except Exception as e:
                self.send_error(500, f"Internal Server Error: {e}")
        else:
            self.send_error(404, "File Not Found")

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        # Parse request body
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            body = json.loads(post_data) if post_data else {}
        except Exception as e:
            self.send_json({"error": f"Invalid JSON body: {e}"}, 400)
            return

        # POST /api/items
        if path == "/api/items" or path == "/api/items/":
            # Validation
            required = ["name", "sku", "category", "quantity", "price", "reorderLevel", "location"]
            for field in required:
                if field not in body:
                    self.send_json({"error": f"Missing required field: {field}"}, 400)
                    return
            
            items = read_db()
            
            # Check SKU uniqueness
            if any(x["sku"].lower() == body["sku"].lower() for x in items):
                self.send_json({"error": f"Item with SKU '{body['sku']}' already exists"}, 409)
                return

            new_id = f"item-{int(datetime.now().timestamp() * 1000)}"
            new_item = {
                "id": new_id,
                "name": body["name"],
                "sku": body["sku"].upper(),
                "category": body["category"],
                "quantity": int(body["quantity"]),
                "price": float(body["price"]),
                "reorderLevel": int(body["reorderLevel"]),
                "location": body["location"],
                "expiryDate": body.get("expiryDate", None),
                "lastUpdated": datetime.utcnow().isoformat() + "Z",
                "description": body.get("description", ""),
                "salesForecast": body.get("salesForecast", [10, 10, 10, 10, 10, 10])
            }
            
            items.append(new_item)
            if write_db(items):
                self.send_json(new_item, 201)
            else:
                self.send_json({"error": "Failed to save to database"}, 500)
            return
            
        # POST /api/reorder/trigger
        elif path == "/api/reorder/trigger":
            # Instantly reorder item (increases stock by a standard batch size)
            item_id = body.get("id")
            if not item_id:
                self.send_json({"error": "Missing item ID"}, 400)
                return
                
            items = read_db()
            item = next((x for x in items if x["id"] == item_id), None)
            if not item:
                self.send_json({"error": "Item not found"}, 404)
                return
                
            # Restock by reorderLevel * 2
            reorder_qty = item["reorderLevel"] * 2
            if reorder_qty <= 0:
                reorder_qty = 50 # Default baseline fallback
            
            item["quantity"] += reorder_qty
            item["lastUpdated"] = datetime.utcnow().isoformat() + "Z"
            
            if write_db(items):
                self.send_json({"success": True, "item": item, "reorderQty": reorder_qty})
            else:
                self.send_json({"error": "Failed to save to database"}, 500)
            return

        # POST /api/expiry/discount
        elif path == "/api/expiry/discount":
            # Apply a discount to an expiring item
            item_id = body.get("id")
            discount_percent = body.get("discountPercent")
            if not item_id or discount_percent is None:
                self.send_json({"error": "Missing item ID or discountPercent"}, 400)
                return
                
            items = read_db()
            item = next((x for x in items if x["id"] == item_id), None)
            if not item:
                self.send_json({"error": "Item not found"}, 404)
                return
                
            # Apply discount to price
            discount_factor = (100 - float(discount_percent)) / 100.0
            item["price"] = round(item["price"] * discount_factor, 2)
            item["lastUpdated"] = datetime.utcnow().isoformat() + "Z"
            
            if write_db(items):
                self.send_json({"success": True, "item": item})
            else:
                self.send_json({"error": "Failed to save to database"}, 500)
            return

        # POST /api/alerts/send
        elif path == "/api/alerts/send":
            alert_type = body.get("type")
            recipient = body.get("to")
            message_body = body.get("body")
            subject = body.get("subject", "StockAlert Notification")
            
            if not alert_type or not recipient or not message_body:
                self.send_json({"error": "Missing type, to, or body parameters"}, 400)
                return
                
            if alert_type == "email":
                # Check for SMTP environment variables
                smtp_server = os.environ.get("SMTP_SERVER")
                smtp_port = os.environ.get("SMTP_PORT", "587")
                smtp_user = os.environ.get("SMTP_USER")
                smtp_password = os.environ.get("SMTP_PASSWORD")
                
                if smtp_server and smtp_user and smtp_password:
                    try:
                        import smtplib
                        from email.mime.text import MIMEText
                        
                        msg = MIMEText(message_body)
                        msg['Subject'] = subject
                        msg['From'] = smtp_user
                        msg['To'] = recipient
                        
                        port = int(smtp_port)
                        if port == 465:
                            server = smtplib.SMTP_SSL(smtp_server, port)
                        else:
                            server = smtplib.SMTP(smtp_server, port)
                            server.starttls()
                            
                        server.login(smtp_user, smtp_password)
                        server.send_message(msg)
                        server.quit()
                        
                        print(f"\n[ALERT - EMAIL] Sent live email to {recipient}\nSubject: {subject}\n")
                        self.send_json({"success": True, "message": f"Live email successfully sent to {recipient} via SMTP!"})
                    except Exception as e:
                        print(f"\n[ALERT - EMAIL ERROR] Live email to {recipient} failed: {e}\n")
                        self.send_json({"success": False, "error": f"SMTP sending failed: {e}"}, 500)
                else:
                    # Mock Simulation Mode
                    print(f"\n==========================================")
                    print(f"[MOCK ALERT - EMAIL SIMULATION]")
                    print(f"To: {recipient}")
                    print(f"Subject: {subject}")
                    print(f"Body:")
                    print(f"------------------------------------------")
                    print(message_body)
                    print(f"==========================================\n")
                    self.send_json({
                        "success": True, 
                        "message": f"Mock Alert: Email simulated successfully to {recipient} (Configure SMTP_SERVER env for live emails)."
                    })
                return
                
            elif alert_type == "sms":
                # Check for Twilio environment variables
                twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
                twilio_token = os.environ.get("TWILIO_AUTH_TOKEN")
                twilio_from = os.environ.get("TWILIO_PHONE_NUMBER")
                
                if twilio_sid and twilio_token and twilio_from:
                    try:
                        url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
                        req_data = urllib.parse.urlencode({
                            "To": recipient,
                            "From": twilio_from,
                            "Body": message_body
                        }).encode("utf-8")
                        
                        req = urllib.request.Request(url, data=req_data, method="POST")
                        auth_str = f"{twilio_sid}:{twilio_token}"
                        b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
                        req.add_header("Authorization", f"Basic {b64_auth}")
                        req.add_header("Content-Type", "application/x-www-form-urlencoded")
                        
                        with urllib.request.urlopen(req) as res:
                            res_content = res.read().decode("utf-8")
                            
                        print(f"\n[ALERT - SMS] Sent live Twilio SMS to {recipient}\nBody: {message_body}\n")
                        self.send_json({"success": True, "message": f"Live SMS successfully sent to {recipient} via Twilio API!"})
                    except Exception as e:
                        print(f"\n[ALERT - SMS ERROR] Live SMS to {recipient} failed: {e}\n")
                        self.send_json({"success": False, "error": f"Twilio API failed: {e}"}, 500)
                else:
                    # Mock Simulation Mode
                    print(f"\n==========================================")
                    print(f"[MOCK ALERT - SMS SIMULATION]")
                    print(f"To: {recipient}")
                    print(f"Body:")
                    print(f"------------------------------------------")
                    print(message_body)
                    print(f"==========================================\n")
                    self.send_json({
                        "success": True,
                        "message": f"Mock Alert: SMS simulated successfully to {recipient} (Configure TWILIO_ACCOUNT_SID env for live SMS)."
                    })
                return

        self.send_json({"error": "Not Found"}, 404)

    def do_PUT(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path.startswith("/api/items/"):
            item_id = path.split("/")[-1]
            
            content_length = int(self.headers.get('Content-Length', 0))
            put_data = self.rfile.read(content_length).decode('utf-8')
            
            try:
                body = json.loads(put_data) if put_data else {}
            except Exception as e:
                self.send_json({"error": f"Invalid JSON body: {e}"}, 400)
                return

            items = read_db()
            item = next((x for x in items if x["id"] == item_id), None)
            if not item:
                self.send_json({"error": "Item not found"}, 404)
                return

            # SKU duplicate check (if SKU is modified)
            if "sku" in body and body["sku"].lower() != item["sku"].lower():
                if any(x["sku"].lower() == body["sku"].lower() for x in items):
                    self.send_json({"error": f"Item with SKU '{body['sku']}' already exists"}, 409)
                    return

            # Update fields
            if "name" in body: item["name"] = body["name"]
            if "sku" in body: item["sku"] = body["sku"].upper()
            if "category" in body: item["category"] = body["category"]
            if "quantity" in body: item["quantity"] = int(body["quantity"])
            if "price" in body: item["price"] = float(body["price"])
            if "reorderLevel" in body: item["reorderLevel"] = int(body["reorderLevel"])
            if "location" in body: item["location"] = body["location"]
            if "expiryDate" in body: item["expiryDate"] = body["expiryDate"]
            if "description" in body: item["description"] = body["description"]
            
            item["lastUpdated"] = datetime.utcnow().isoformat() + "Z"
            
            if write_db(items):
                self.send_json(item)
            else:
                self.send_json({"error": "Failed to save to database"}, 500)
            return

        self.send_json({"error": "Not Found"}, 404)

    def do_DELETE(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path.startswith("/api/items/"):
            item_id = path.split("/")[-1]
            items = read_db()
            item = next((x for x in items if x["id"] == item_id), None)
            
            if not item:
                self.send_json({"error": "Item not found"}, 404)
                return

            new_items = [x for x in items if x["id"] != item_id]
            if write_db(new_items):
                self.send_json({"success": True, "message": f"Item {item_id} deleted successfully"})
            else:
                self.send_json({"error": "Failed to save to database"}, 500)
            return

        self.send_json({"error": "Not Found"}, 404)

if __name__ == "__main__":
    # Ensure database file exists
    if not os.path.exists(DB_FILE):
        write_db([])
        
    handler = DashboardRequestHandler
    # Run the server
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"StockMind AI Server running at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.server_close()
