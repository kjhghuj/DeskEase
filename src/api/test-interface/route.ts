
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Test Interface</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; background-color: #f4f4f4; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { margin-top: 0; color: #333; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
        input[type="text"], select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        textarea { height: 100px; font-family: monospace; }
        button { background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background-color: #0056b3; }
        #response-container { margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; display: none; }
        .response-meta { background: #eee; padding: 10px; border-radius: 4px; margin-bottom: 10px; font-family: monospace; }
        pre { background: #2d2d2d; color: #ccc; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .error { color: #dc3545; }
        .success { color: #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <h1>API Tester</h1>

        <div class="form-group">
            <label for="url">Request URL</label>
            <input type="text" id="url" value="/store/products" placeholder="/store/products">
        </div>

        <div class="form-group">
            <label for="method">Method</label>
            <select id="method">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
            </select>
        </div>

        <div class="form-group">
            <label for="headers">Headers (JSON)</label>
            <textarea id="headers" placeholder='{ "Content-Type": "application/json", "x-publishable-api-key": "..." }'>{
    "Content-Type": "application/json"
}</textarea>
        </div>

        <div class="form-group">
            <label for="body">Body (JSON)</label>
            <textarea id="body" placeholder='{ "email": "test@example.com" }'></textarea>
        </div>

        <button onclick="sendRequest()">Send Request</button>

        <div id="response-container">
            <h3>Response</h3>
            <div class="response-meta" id="response-meta"></div>
            <pre id="response-body"></pre>
        </div>
    </div>

    <script>
        async function sendRequest() {
            const urlInput = document.getElementById('url').value;
            const method = document.getElementById('method').value;
            const headersStr = document.getElementById('headers').value;
            const bodyStr = document.getElementById('body').value;

            const responseContainer = document.getElementById('response-container');
            const metaDiv = document.getElementById('response-meta');
            const bodyPre = document.getElementById('response-body');

            responseContainer.style.display = 'block';
            metaDiv.textContent = 'Loading...';
            bodyPre.textContent = '';

            try {
                let headers = {};
                if (headersStr.trim()) {
                    try {
                        headers = JSON.parse(headersStr);
                    } catch (e) {
                        alert('Invalid Headers JSON');
                        return;
                    }
                }

                let body = undefined;
                if (method !== 'GET' && method !== 'HEAD' && bodyStr.trim()) {
                    try {
                        JSON.parse(bodyStr); // Validate JSON
                        body = bodyStr;
                    } catch (e) {
                        alert('Invalid Body JSON');
                        return;
                    }
                }

                // Handle relative URLs
                const fullUrl = urlInput.startsWith('http') ? urlInput : window.location.origin + (urlInput.startsWith('/') ? '' : '/') + urlInput;

                const startTime = Date.now();
                const res = await fetch(fullUrl, {
                    method,
                    headers,
                    body
                });
                const duration = Date.now() - startTime;

                const statusClass = res.ok ? 'success' : 'error';
                metaDiv.innerHTML = \`Status: <span class="\${statusClass}">\${res.status} \${res.statusText}</span> | Time: \${duration}ms\`;

                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await res.json();
                    bodyPre.textContent = JSON.stringify(data, null, 2);
                } else {
                    const text = await res.text();
                    bodyPre.textContent = text;
                }

            } catch (err) {
                metaDiv.innerHTML = '<span class="error">Network Error</span>';
                bodyPre.textContent = err.message;
            }
        }
    </script>
</body>
</html>
  `

  res.send(html)
}
