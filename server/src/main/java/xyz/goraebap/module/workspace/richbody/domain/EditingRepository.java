package xyz.goraebap.module.workspace.richbody.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface EditingRepository {
    record Lease(UUID userId, Instant startedAt) {}

    record Owner(String type, UUID id) {}

    List<Lease> active(String type, UUID id, Instant after);

    boolean keep(String type, UUID id, UUID user, UUID lease, Instant now, Instant after);

    boolean remove(String type, UUID id, UUID user, UUID lease);

    List<Owner> expire(Instant before);
}
