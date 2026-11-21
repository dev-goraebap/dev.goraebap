package xyz.goraebap.cowork.shared.web;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * A read worth keeping in the activity record, as every change already is: one that shows a member's sensitive
 * information or carries it off (an evidence file, a health record, a report file). Reads without it are only counted.
 */
@Documented
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RecordedRead {}
