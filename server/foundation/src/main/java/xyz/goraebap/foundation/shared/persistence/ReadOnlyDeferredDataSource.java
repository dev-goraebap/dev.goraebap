package xyz.goraebap.foundation.shared.persistence;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.jdbc.datasource.DelegatingDataSource;
import org.sqlite.SQLiteConfig.TransactionMode;
import org.sqlite.SQLiteConnection;

/**
 * The application's SQLite connections, where a read-only transaction begins DEFERRED and refuses to write.
 *
 * <p>Every other transaction begins IMMEDIATE (transaction_mode), taking SQLite's one write lock as it starts so two
 * writes never collide halfway through. A read-only one needs no lock: in WAL it reads its snapshot beside the others
 * and beside a write. Spring marks a connection read-only before it begins the transaction and unmarks it after, so the
 * mark picks how the next BEGIN is written. The driver's own read-only switch (jdbc.explicit_readonly) is not used: it
 * makes every begin DEFERRED, and the database migrations then fail to upgrade their transactions.
 */
final class ReadOnlyDeferredDataSource extends DelegatingDataSource {
    ReadOnlyDeferredDataSource(DataSource target) {
        super(target);
    }

    @Override
    public Connection getConnection() throws SQLException {
        return wrap(super.getConnection());
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return wrap(super.getConnection(username, password));
    }

    private static Connection wrap(Connection connection) {
        return (Connection) Proxy.newProxyInstance(
                Connection.class.getClassLoader(), new Class<?>[] {Connection.class}, new Marking(connection));
    }

    /** Turns the read-only mark into the next BEGIN's kind and query_only; the rest goes to the pooled connection. */
    private static final class Marking implements InvocationHandler {
        private final Connection target;
        private boolean readOnly;

        Marking(Connection target) {
            this.target = target;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            switch (method.getName()) {
                case "setReadOnly" -> {
                    mark((Boolean) args[0]);
                    return null;
                }
                case "isReadOnly" -> {
                    return readOnly;
                }
                case "close" -> {
                    // A connection goes back to the pool writable, whatever happened to the transaction.
                    if (readOnly && !target.isClosed()) mark(false);
                }
                case "unwrap" -> {
                    if (((Class<?>) args[0]).isInstance(proxy)) return proxy;
                }
                case "isWrapperFor" -> {
                    if (((Class<?>) args[0]).isInstance(proxy)) return true;
                }
                default -> {}
            }
            try {
                return method.invoke(target, args);
            } catch (InvocationTargetException e) {
                throw e.getCause();
            }
        }

        private void mark(boolean readOnly) throws SQLException {
            if (readOnly == this.readOnly) return;
            var sqlite = target.unwrap(SQLiteConnection.class);
            sqlite.getConnectionConfig()
                    .setTransactionMode(readOnly ? TransactionMode.DEFERRED : TransactionMode.IMMEDIATE);
            try (var statement = target.createStatement()) {
                statement.execute("PRAGMA query_only = " + (readOnly ? "ON" : "OFF"));
            }
            this.readOnly = readOnly;
        }
    }
}
