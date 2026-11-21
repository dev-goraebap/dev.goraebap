package xyz.goraebap.shared.persistence;

import javax.sql.DataSource;
import org.springframework.beans.factory.config.BeanPostProcessor;
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
