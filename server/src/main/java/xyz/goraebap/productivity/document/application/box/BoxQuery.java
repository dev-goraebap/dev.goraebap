package xyz.goraebap.productivity.document.application.box;

import java.util.List;

/** 문서함's top as the screens read it; the rows carry no people's names. */
public interface BoxQuery {
    /** Every project that is not deleted as its folder, in the administrators' order. */
    List<BoxViews.ProjectFolder> findProjectFolders();
}
