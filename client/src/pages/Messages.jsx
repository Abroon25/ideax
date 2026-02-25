import { useEffect, useState } from "react"
import api from "../services/api"

export default function Messages() {
  const [conversations, setConversations] = useState([])

  useEffect(() => {
    api.get("/messages/conversations")
      .then(res => setConversations(res.data))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Messages</h1>
      {conversations.map(c => (
        <div key={c.id} className="card p-4 mb-2">
          Conversation {c.id}
        </div>
      ))}
    </div>
  )
}