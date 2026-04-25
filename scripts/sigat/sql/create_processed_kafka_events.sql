-- Idempotencia consumidores Kafka (A0.5).
-- **Canónico en repo:** `develop/backend/sigat-orchestation/sigat-notifications/database/migrations/010-processed-kafka-events.sql`
-- (se aplica con `cd sigat-notifications && npm run migrate`). Esta copia sirve para `psql -f` manual si se prefiere.
CREATE TABLE IF NOT EXISTS sigat.processed_kafka_events (
  event_id UUID PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  topic VARCHAR(256) NOT NULL
);

COMMENT ON TABLE sigat.processed_kafka_events IS 'Dedup por event_id por servicio de notificaciones (reentrega Kafka)';
