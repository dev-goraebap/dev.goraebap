package xyz.goraebap.cowork.module.workspace.document.application.chapter;

import java.util.List;
import java.util.UUID;

/** A 매뉴얼's live chapters as its contents read them, by place; the rows carry no people's names. */
public interface ChapterQuery {
    List<ChapterViews.ChapterRow> findAll(UUID documentId);
}
