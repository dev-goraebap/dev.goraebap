package xyz.goraebap.module.foundation.notification.application;

/** Pushes were queued in a transaction; once it commits the dispatcher sends them. */
record PushQueued() {}
