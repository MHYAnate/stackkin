// apps/backend/src/graphql/schema/typeDefs/chat.typeDef.js

import { gql } from 'apollo-server-express';

export const chatTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum ChatRoomType {
    GENERAL
    CATEGORY
    COUNTRY
    LANGUAGE
    PREMIUM
    DIRECT
    GROUP
    SQUAD
    COLLABORATION
  }

  enum MessageType {
    TEXT
    IMAGE
    FILE
    CODE
    LINK
    SYSTEM
    ANNOUNCEMENT
    POLL
  }

  enum MessageStatus {
    SENT
    DELIVERED
    READ
  }

  enum MemberRole {
    OWNER
    ADMIN
    MODERATOR
    MEMBER
  }

  enum MuteStatus {
    MUTED
    UNMUTED
  }

  enum AnnouncementPriority {
    LOW
    NORMAL
    HIGH
    URGENT
  }

  enum AnnouncementStatus {
    DRAFT
    SCHEDULED
    PUBLISHED
    EXPIRED
    CANCELLED
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input SendMessageInput {
    roomId: ID!
    type: MessageType!
    content: String!
    attachments: [AttachmentInput!]
    replyToId: ID
    mentions: [ID!]
    codeLanguage: String
  }

  input UpdateMessageInput {
    content: String!
  }

  input CreateGroupChatInput {
    name: String!
    description: String
    image: String
    memberIds: [ID!]!
    isPrivate: Boolean
  }

  input UpdateGroupChatInput {
    name: String
    description: String
    image: String
    isPrivate: Boolean
  }

  input CreateAnnouncementInput {
    roomId: ID!
    title: String!
    content: String!
    priority: AnnouncementPriority!
    attachments: [AttachmentInput!]
    isPinned: Boolean
    scheduledAt: DateTime
    expiresAt: DateTime
  }

  input UpdateAnnouncementInput {
    title: String
    content: String
    priority: AnnouncementPriority
    attachments: [AttachmentInput!]
    isPinned: Boolean
    expiresAt: DateTime
  }

  input CreatePollInput {
    roomId: ID!
    question: String!
    options: [String!]!
    allowMultiple: Boolean
    endsAt: DateTime
    isAnonymous: Boolean
  }

  input ChatRoomFilterInput {
    type: [ChatRoomType!]
    search: String
    isJoined: Boolean
    country: String
    language: String
    category: ID
  }

  input MessageFilterInput {
    type: [MessageType!]
    userId: ID
    hasAttachments: Boolean
    search: String
    after: DateTime
    before: DateTime
  }

  # ==========================================
  # TYPES
  # ==========================================

  type ChatRoom {
    id: ID!
    name: String!
    description: String
    image: String
    type: ChatRoomType!
    
    # Access Control
    isPublic: Boolean!
    requiredTier: SubscriptionTier
    requiredCountry: String
    requiredLanguage: String
    category: Category
    
    # Members
    members: [ChatMember!]!
    membersCount: Int!
    onlineCount: Int!
    
    # Messages
    lastMessage: Message
    unreadCount: Int!
    
    # Settings
    settings: ChatRoomSettings!
    
    # For Groups
    owner: User
    admins: [User!]!
    
    # Announcements
    pinnedAnnouncements: [Announcement!]!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ChatRoomSettings {
    allowAttachments: Boolean!
    allowPins: Boolean!
    allowPolls: Boolean!
    slowMode: Int
    maxMessageLength: Int
    onlyAdminsCanPost: Boolean!
  }

  type ChatMember {
    id: ID!
    user: User!
    room: ChatRoom!
    role: MemberRole!
    nickname: String
    muteStatus: MuteStatus!
    mutedUntil: DateTime
    notificationsEnabled: Boolean!
    lastReadAt: DateTime
    joinedAt: DateTime!
  }

  type Message {
    id: ID!
    room: ChatRoom!
    sender: User!
    type: MessageType!
    content: String!
    attachments: [MessageAttachment!]!
    
    # Code blocks
    codeLanguage: String
    
    # Reply
    replyTo: Message
    
    # Mentions
    mentions: [User!]!
    
    # Reactions
    reactions: [Reaction!]!
    reactionsCount: Int!
    
    # Status
    status: MessageStatus!
    isEdited: Boolean!
    editedAt: DateTime
    isDeleted: Boolean!
    deletedAt: DateTime
    
    # For polls
    poll: Poll
    
    # Read receipts
    readBy: [ReadReceipt!]!
    readByCount: Int!
    
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MessageAttachment {
    id: ID!
    name: String!
    url: String!
    type: String!
    size: Int!
    thumbnailUrl: String
  }

  type Reaction {
    emoji: String!
    users: [User!]!
    count: Int!
  }

  type ReadReceipt {
    user: User!
    readAt: DateTime!
  }

  type Poll {
    id: ID!
    question: String!
    options: [PollOption!]!
    allowMultiple: Boolean!
    isAnonymous: Boolean!
    totalVotes: Int!
    endsAt: DateTime
    isEnded: Boolean!
    createdAt: DateTime!
  }

  type PollOption {
    id: ID!
    text: String!
    votesCount: Int!
    percentage: Float!
    hasVoted: Boolean!
    voters: [User!]
  }

  type Announcement {
    id: ID!
    room: ChatRoom!
    author: User!
    title: String!
    content: String!
    priority: AnnouncementPriority!
    attachments: [MessageAttachment!]!
    isPinned: Boolean!
    status: AnnouncementStatus!
    views: Int!
    scheduledAt: DateTime
    publishedAt: DateTime
    expiresAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type DirectChat {
    id: ID!
    participants: [User!]!
    otherParticipant: User!
    lastMessage: Message
    unreadCount: Int!
    isBlocked: Boolean!
    blockedBy: User
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ChatRoomConnection {
    edges: [ChatRoomEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ChatRoomEdge {
    node: ChatRoom!
    cursor: String!
  }

  type MessageConnection {
    edges: [MessageEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type MessageEdge {
    node: Message!
    cursor: String!
  }

  type DirectChatConnection {
    edges: [DirectChatEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type DirectChatEdge {
    node: DirectChat!
    cursor: String!
  }

  type TypingIndicator {
    roomId: ID!
    user: User!
    isTyping: Boolean!
  }

  type UserPresence {
    userId: ID!
    isOnline: Boolean!
    lastSeenAt: DateTime
    status: String
  }

  type UnreadCounts {
    totalUnread: Int!
    byRoom: [RoomUnreadCount!]!
  }

  type RoomUnreadCount {
    roomId: ID!
    roomName: String!
    count: Int!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Chat Rooms
    chatRoom(id: ID!): ChatRoom
    chatRooms(
      filter: ChatRoomFilterInput
      pagination: PaginationInput
    ): ChatRoomConnection!
    
    myChatRooms(
      filter: ChatRoomFilterInput
      pagination: PaginationInput
    ): ChatRoomConnection!
    
    # Public Rooms by Type
    generalChatRoom: ChatRoom!
    categoryChatRooms(pagination: PaginationInput): ChatRoomConnection!
    countryChatRooms(pagination: PaginationInput): ChatRoomConnection!
    languageChatRooms(pagination: PaginationInput): ChatRoomConnection!
    premiumChatRoom: ChatRoom
    
    # Messages
    messages(
      roomId: ID!
      filter: MessageFilterInput
      pagination: PaginationInput
    ): MessageConnection!
    
    message(id: ID!): Message
    
    searchMessages(
      query: String!
      roomId: ID
      pagination: PaginationInput
    ): MessageConnection!
    
    # Direct Messages
    directChats(pagination: PaginationInput): DirectChatConnection!
    directChat(userId: ID!): DirectChat
    
    # Announcements
    announcements(
      roomId: ID!
      pagination: PaginationInput
    ): [Announcement!]!
    
    # Presence & Status
    onlineUsers(roomId: ID!): [UserPresence!]!
    userPresence(userId: ID!): UserPresence
    
    # Unread Counts
    unreadCounts: UnreadCounts!
    
    # Access Check
    canAccessRoom(roomId: ID!): Boolean!
    availableRooms: [ChatRoom!]!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Messages
    sendMessage(input: SendMessageInput!): Message!
    updateMessage(id: ID!, input: UpdateMessageInput!): Message!
    deleteMessage(id: ID!): MessageResponse!
    
    # Reactions
    addReaction(messageId: ID!, emoji: String!): Message!
    removeReaction(messageId: ID!, emoji: String!): Message!
    
    # Read Status
    markAsRead(roomId: ID!): MessageResponse!
    markAllAsRead: MessageResponse!
    
    # Room Actions
    joinRoom(roomId: ID!): ChatMember!
    leaveRoom(roomId: ID!): MessageResponse!
    
    # Group Management
    createGroupChat(input: CreateGroupChatInput!): ChatRoom!
    updateGroupChat(id: ID!, input: UpdateGroupChatInput!): ChatRoom!
    deleteGroupChat(id: ID!): MessageResponse!
    addMember(roomId: ID!, userId: ID!): ChatMember!
    removeMember(roomId: ID!, userId: ID!): MessageResponse!
    promoteMember(roomId: ID!, userId: ID!, role: MemberRole!): ChatMember!
    
    # Member Settings
    updateNotificationSettings(roomId: ID!, enabled: Boolean!): ChatMember!
    setNickname(roomId: ID!, nickname: String): ChatMember!
    
    # Direct Messages
    startDirectChat(userId: ID!): DirectChat!
    blockUser(userId: ID!): DirectChat!
    unblockUser(userId: ID!): DirectChat!
    
    # Announcements (requires tier)
    createAnnouncement(input: CreateAnnouncementInput!): Announcement!
    updateAnnouncement(id: ID!, input: UpdateAnnouncementInput!): Announcement!
    deleteAnnouncement(id: ID!): MessageResponse!
    publishAnnouncement(id: ID!): Announcement!
    
    # Polls
    createPoll(input: CreatePollInput!): Message!
    votePoll(pollId: ID!, optionIds: [ID!]!): Poll!
    endPoll(pollId: ID!): Poll!
    
    # Presence
    updatePresence(status: String): UserPresence!
    
    # Typing Indicator
    setTyping(roomId: ID!, isTyping: Boolean!): Boolean!
    
    # Moderation
    muteUser(roomId: ID!, userId: ID!, duration: Int): ChatMember!
    unmuteUser(roomId: ID!, userId: ID!): ChatMember!
    pinMessage(messageId: ID!): Message!
    unpinMessage(messageId: ID!): Message!
    
    # Room Settings (Admin only)
    updateRoomSettings(
      roomId: ID!
      settings: ChatRoomSettingsInput!
    ): ChatRoom!
  }

  input ChatRoomSettingsInput {
    allowAttachments: Boolean
    allowPins: Boolean
    allowPolls: Boolean
    slowMode: Int
    maxMessageLength: Int
    onlyAdminsCanPost: Boolean
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    messageReceived(roomId: ID!): Message!
    messageUpdated(roomId: ID!): Message!
    messageDeleted(roomId: ID!): ID!
    typingIndicator(roomId: ID!): TypingIndicator!
    userPresenceChanged(roomId: ID): UserPresence!
    newAnnouncement(roomId: ID): Announcement!
    roomUpdated(roomId: ID!): ChatRoom!
    pollVoted(pollId: ID!): Poll!
  }
`;

export default chatTypeDef;