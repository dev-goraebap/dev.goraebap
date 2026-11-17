package xyz.goraebap.module.foundation.system.infrastructure;

import java.lang.management.ManagementFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import xyz.goraebap.module.foundation.system.application.RuntimeLoad;

/** Measures the processor load every minute (the status page reads again every minute), so the status page reads the last measurement at once. */
@Component
class SampledRuntimeLoad implements RuntimeLoad {
    private volatile Double process;
    private volatile Double system;

    @Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT1S")
    void measure() {
        if (ManagementFactory.getOperatingSystemMXBean() instanceof com.sun.management.OperatingSystemMXBean os) {
            process = load(os.getProcessCpuLoad());
            system = load(os.getCpuLoad());
        }
    }

    @Override
    public Double processCpu() {
        return process;
    }

    @Override
    public Double systemCpu() {
        return system;
    }

    private static Double load(double value) {
        return value < 0 ? null : value;
    }
}
