const router = require("express").Router()
const { authenticate } = require("../middleware/auth")
const {
  createConversation,
  sendMessage,
  getConversations,
  getMessages
} = require("../controllers/messageController")

router.post("/conversation", authenticate, createConversation)
router.get("/conversations", authenticate, getConversations)
router.post("/send", authenticate, sendMessage)
router.get("/:id", authenticate, getMessages)

module.exports = router