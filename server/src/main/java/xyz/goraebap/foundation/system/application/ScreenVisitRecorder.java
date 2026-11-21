package xyz.goraebap.foundation.system.application;

import java.util.UUID;

/** Hands a member's opening of a main screen to the log writer, never waiting on the log store. */
public interface ScreenVisitRecorder {
    void record(UUID employeeId, String screen, String ip, String userAgent);
}
