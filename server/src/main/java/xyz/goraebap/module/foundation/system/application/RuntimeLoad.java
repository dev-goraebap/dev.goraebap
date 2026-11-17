package xyz.goraebap.module.foundation.system.application;

/**
 * The processor load as last measured, from 0 to 1; null before the first measurement or where the JVM cannot tell.
 * Measuring can take a while (on Windows a reading takes hundreds of milliseconds), so it is done apart from requests.
 */
public interface RuntimeLoad {
    Double processCpu();

    Double systemCpu();
}
