CREATE TABLE notifications (
  notification_id uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid         NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  type            varchar(50)  NOT NULL,
  message         text         NOT NULL,
  is_read         boolean      NOT NULL DEFAULT false,
  event_ref       varchar(200) NOT NULL UNIQUE,
  created_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);
