const prisma = require("../config/database")

const createConversation = async (req, res) => {
  const { userId } = req.body
  const currentUserId = req.user.id

  if (userId === currentUserId)
    return res.status(400).json({ error: "Cannot message yourself" })

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: currentUserId },
          { userId: userId }
        ]
      }
    },
    include: { participants: true }
  })

  res.json(conversation)
}

const sendMessage = async (req, res) => {
  const { conversationId, content } = req.body

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: req.user.id,
      content
    }
  })

  res.json(message)
}

const getConversations = async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId: req.user.id }
      }
    },
    include: {
      participants: { include: { user: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  })

  res.json(conversations)
}

const getMessages = async (req, res) => {
  const { id } = req.params

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: true }
  })

  res.json(messages)
}

module.exports = {
  createConversation,
  sendMessage,
  getConversations,
  getMessages
}