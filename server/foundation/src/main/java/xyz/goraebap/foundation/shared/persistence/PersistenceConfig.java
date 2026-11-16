package xyz.goraebap.foundation.shared.persistence;

import java.util.Comparator;
import java.util.List;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.boot.jooq.autoconfigure.ExceptionTranslatorExecuteListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

/**
 * The SQLite database: its file's folder made before the first connection, its read-only transactions begun without
 * the write lock, and jOOQ's errors through the SQLite translator, so a broken constraint is a conflict and not a
 * server error.
 */
@Configuration
public class PersistenceConfig {
    /** The foundation's own tables, made first. */
    @Bean
    ModuleMigration foundationMigration() {
        return new ModuleMigration("foundation", "classpath:db/foundation", 0);
    }

    /**
     * Every subproject in the assembly brings its own migrations (ModuleMigration); each set runs in order against
     * the one database and keeps its own record. The record of a later subproject starts on a database that already
     * has tables, hence the baseline at 0, below every V1.
     */
    @Bean
    FlywayMigrationStrategy moduleMigrations(List<ModuleMigration> modules) {
        return configured -> modules.stream()
                .sorted(Comparator.comparingInt(ModuleMigration::order).thenComparing(ModuleMigration::name))
                .forEach(module -> Flyway.configure()
                        .dataSource(configured.getConfiguration().getDataSource())
                        .locations(module.location())
                        .table(module.historyTable())
                        .baselineOnMigrate(true)
                        .baselineVersion("0")
                        .load()
                        .migrate());
    }

    @Bean
    static SqliteFolder sqliteFolder(Environment environment) {
        return new SqliteFolder(environment);
    }

    /** The application's database (not the system log's, which keeps its own pool) behind ReadOnlyDeferredDataSource. */
    @Bean
    static BeanPostProcessor readOnlyDeferredDataSource() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                return bean instanceof DataSource dataSource
                                && "dataSource".equals(beanName)
                                && !(bean instanceof ReadOnlyDeferredDataSource)
                        ? new ReadOnlyDeferredDataSource(dataSource)
                        : bean;
            }
        };
    }

    @Bean
    ExceptionTranslatorExecuteListener jooqExceptionTranslator() {
        var translator = new SqliteExceptionTranslator();
        return ExceptionTranslatorExecuteListener.of(context -> translator);
    }
}
