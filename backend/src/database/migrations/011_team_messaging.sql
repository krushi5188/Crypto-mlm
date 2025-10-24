-- Migration 011: Team Messaging System
-- Description: Real-time team communication and messaging

-- Chat Rooms/Channels
CREATE TABLE chat_rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  room_type VARCHAR(20) DEFAULT 'group', -- group, direct, announcement

  -- For direct messages (1-on-1)
  participant_1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  participant_2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Settings
  is_private BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  max_members INTEGER, -- null = unlimited

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Room Members
CREATE TABLE chat_members (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  role VARCHAR(20) DEFAULT 'member', -- admin, moderator, member

  -- Notifications
  notifications_enabled BOOLEAN DEFAULT true,

  -- Tracking
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_room_member UNIQUE(room_id, user_id)
);

-- Messages
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- text, image, file, system

  -- Attachments
  attachment_url VARCHAR(500),
  attachment_type VARCHAR(50),
  attachment_size INTEGER,

  -- Rich features
  mentions JSONB, -- array of mentioned user IDs
  is_pinned BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP,

  -- Reply/Thread
  reply_to_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message Read Receipts
CREATE TABLE message_read_receipts (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_message_user_read UNIQUE(message_id, user_id)
);

-- Message Reactions (emoji reactions)
CREATE TABLE message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL, -- 👍, ❤️, 😊, etc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_message_user_reaction UNIQUE(message_id, user_id, emoji)
);

-- Chat Attachments (for file management)
CREATE TABLE chat_attachments (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_rooms_type ON chat_rooms(room_type);
CREATE INDEX idx_chat_members_room ON chat_members(room_id);
CREATE INDEX idx_chat_members_user ON chat_members(user_id);
CREATE INDEX idx_messages_room ON chat_messages(room_id);
CREATE INDEX idx_messages_user ON chat_messages(user_id);
CREATE INDEX idx_messages_created ON chat_messages(created_at);
CREATE INDEX idx_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX idx_reactions_message ON message_reactions(message_id);

COMMENT ON TABLE chat_rooms IS 'Chat rooms and direct message conversations';
COMMENT ON TABLE chat_members IS 'Users participating in chat rooms';
COMMENT ON TABLE chat_messages IS 'Chat messages and content';
COMMENT ON TABLE message_read_receipts IS 'Track which users have read which messages';
COMMENT ON TABLE message_reactions IS 'Emoji reactions to messages';
COMMENT ON TABLE chat_attachments IS 'File attachments in messages';
