async function sendMessage() {
  const input = document.getElementById("kregg-input").value;

  const response = await fetch("http://127.0.0.1:8000/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message: input })
  });

  const data = await response.json();
  document.getElementById("kregg-output").innerText = data.reply;
}

document.body.innerHTML += `
<div style="position:fixed;bottom:20px;right:20px;background:#fff;border:1px solid #ccc;padding:10px">
  <input id="kregg-input" placeholder="Ask something..." />
  <button onclick="sendMessage()">Send</button>
  <div id="kregg-output"></div>
</div>
`;
