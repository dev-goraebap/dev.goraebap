package xyz.goraebap.workspace;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.core.annotation.AliasFor;
import org.springframework.transaction.annotation.Transactional;

/**
 * A transaction on the workspace's own database. Every service here uses this instead of @WorkspaceTransactional, which would
 * open one on the foundation's database and leave the workspace's writes outside it.
 */
@Documented
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Transactional(transactionManager = WorkspaceDatabaseConfig.TRANSACTION_MANAGER)
public @interface WorkspaceTransactional {
    @AliasFor(annotation = Transactional.class, attribute = "readOnly")
    boolean readOnly() default false;
}
