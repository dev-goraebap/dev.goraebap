package xyz.goraebap.foundation.shared.persistence;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.jooq.DSLContext;
import org.jooq.SQLDialect;
import org.jooq.impl.DSL;
import org.jooq.impl.DataSourceConnectionProvider;
import org.jooq.impl.DefaultConfiguration;
import org.jooq.impl.DefaultExecuteListenerProvider;
import org.springframework.boot.jooq.autoconfigure.ExceptionTranslatorExecuteListener;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * A subproject's own SQLite file, opened the way the foundation's is: WAL, a write transaction taking the write lock as
 * it begins, a read-only one beginning without it, foreign keys on, and jOOQ's errors through the SQLite translator.
 * Its migrations run as it opens. A subproject makes one of these, and from it the jOOQ context and the transaction
 * manager its own repositories and services name; nothing else connects to the file.
 */
public final class SubprojectDatabase implements AutoCloseable {
    private final HikariDataSource pool;
    private final DataSource dataSource;
    private final DataSourceTransactionManager transactionManager;
    private final DSLContext dsl;

    private SubprojectDatabase(HikariDataSource pool) {
        this.pool = pool;
        this.dataSource = new ReadOnlyDeferredDataSource(pool);
        this.transactionManager = new DataSourceTransactionManager(dataSource);
        var translator = new SqliteExceptionTranslator();
        var configuration = new DefaultConfiguration()
                .set(new DataSourceConnectionProvider(new TransactionAwareDataSourceProxy(dataSource)))
                .set(SQLDialect.SQLITE)
                .set(new DefaultExecuteListenerProvider(ExceptionTranslatorExecuteListener.of(context -> translator)));
        this.dsl = DSL.using(configuration);
    }

    /**
     * Opens the file (its folder made first) and brings it to the newest of the migrations at the classpath location,
     * such as classpath:db/workspace.
     */
    public static SubprojectDatabase open(String name, String file, String migrations) {
        Path path = Path.of(file).toAbsolutePath().normalize();
        try {
            if (path.getParent() != null) Files.createDirectories(path.getParent());
        } catch (IOException e) {
            throw new UncheckedIOException("SQLite 파일 폴더를 만들 수 없습니다: " + path.getParent(), e);
        }
        var config = new HikariConfig();
        config.setPoolName(name);
        config.setJdbcUrl("jdbc:sqlite:" + path);
        config.addDataSourceProperty("journal_mode", "WAL");
        config.addDataSourceProperty("synchronous", "NORMAL");
        config.addDataSourceProperty("busy_timeout", "5000");
        config.addDataSourceProperty("foreign_keys", "true");
        config.addDataSourceProperty("transaction_mode", "IMMEDIATE");
        var pool = new HikariDataSource(config);
        try {
            Flyway.configure().dataSource(pool).locations(migrations).load().migrate();
        } catch (RuntimeException e) {
            pool.close();
            throw e;
        }
        return new SubprojectDatabase(pool);
    }

    public DSLContext dsl() {
        return dsl;
    }

    public PlatformTransactionManager transactionManager() {
        return transactionManager;
    }

    /** For the few places that need plain JDBC; the same connections the transactions use. */
    public DataSource dataSource() {
        return dataSource;
    }

    @Override
    public void close() {
        pool.close();
    }
}
