package xyz.goraebap.workspace;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.fields;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.jooq.DSLContext;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;

/**
 * workspace가 자기 DB만 쓰게 지키는 규칙. 이름 없이 받은 DSLContext · 트랜잭션 관리자 · @Transactional은 foundation의 DB에
 * 걸린다. 그러면 workspace의 저장이 그 트랜잭션 밖에서 하나씩 커밋되어, 함께 되돌려져야 할 변경이 반만 남는다.
 */
@AnalyzeClasses(packages = "xyz.goraebap.workspace", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {
    @ArchTest
    static final ArchRule 다른_하위_프로젝트의_표를_언급하지_않는다 = noClasses()
            .should()
            .dependOnClassesThat()
            .resideInAPackage("xyz.goraebap.foundation.jooq..")
            .because("다른 하위 프로젝트와는 Facade와 확장점으로만 주고받는다");

    @ArchTest
    static final ArchRule 다른_하위_프로젝트의_내부를_쓰지_않는다 = noClasses()
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                    "xyz.goraebap.foundation.user.application..",
                    "xyz.goraebap.foundation.user.domain..",
                    "xyz.goraebap.foundation.user.infrastructure..",
                    "xyz.goraebap.foundation.file.application..",
                    "xyz.goraebap.foundation.file.domain..",
                    "xyz.goraebap.foundation.file.infrastructure..",
                    "xyz.goraebap.foundation.notification.application..",
                    "xyz.goraebap.foundation.notification.domain..",
                    "xyz.goraebap.foundation.notification.infrastructure..")
            .because("모듈 루트의 공개 계약만 쓴다");

    @ArchTest
    static final ArchRule 트랜잭션은_workspace의_것을_쓴다 = noMethods()
            .should()
            .beAnnotatedWith(Transactional.class)
            .because("@WorkspaceTransactional을 쓴다");

    @ArchTest
    static final ArchRule 클래스에도_기본_트랜잭션을_붙이지_않는다 = noClasses()
            .that()
            .areNotAnnotations()
            .should()
            .beAnnotatedWith(Transactional.class)
            .because("@WorkspaceTransactional을 쓴다");

    @ArchTest
    static final ArchRule DSLContext는_이름으로_받는다 = fields()
            .that()
            .haveRawType(DSLContext.class)
            .should()
            .beAnnotatedWith(Qualifier.class)
            .because("이름 없는 DSLContext는 foundation의 DB를 가리킨다");

    @ArchTest
    static final ArchRule 트랜잭션_관리자는_이름으로_받는다 = fields()
            .that()
            .haveRawType(PlatformTransactionManager.class)
            .should()
            .beAnnotatedWith(Qualifier.class)
            .because("이름 없는 트랜잭션 관리자는 foundation의 DB를 가리킨다");
}
