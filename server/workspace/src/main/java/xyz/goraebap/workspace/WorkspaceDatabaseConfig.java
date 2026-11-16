package xyz.goraebap.workspace;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import xyz.goraebap.foundation.shared.persistence.ModuleMigration;

/** The workspace's tables: its own migrations and its own record of them, in the database every subproject shares. */
@Configuration(proxyBeanMethods = false)
class WorkspaceDatabaseConfig {
    @Bean
    ModuleMigration workspaceMigration() {
        return new ModuleMigration("workspace", "classpath:db/workspace", 10);
    }
}
