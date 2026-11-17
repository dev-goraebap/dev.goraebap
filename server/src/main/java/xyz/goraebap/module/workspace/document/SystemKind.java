package xyz.goraebap.module.workspace.document;

/**
 * 문서함's system folders (docs/pending-records.md, 문서함): the documents another module makes and keeps, listed in 문서함
 * with the rest. 회의록 are narrowed by project, 주간보고 by department.
 */
public enum SystemKind {
    MEETING,
    WEEKLY_REPORT
}
