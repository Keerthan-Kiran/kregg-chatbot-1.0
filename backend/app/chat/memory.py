from typing import List, Dict

# simple in-memory store
chat_history: List[Dict[str, str]] = []

def save_message(role: str, content: str):
    chat_history.append({
        "role": role,
        "content": content
    })

def get_history():
    return chat_history
