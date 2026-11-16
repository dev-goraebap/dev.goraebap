package xyz.goraebap.workspace;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/**
 * workspace와 다른 하위 프로젝트 사이의 경계. DB는 하나를 같이 쓰지만 서로의 표는 모른다. 같은 DB라 조인이 되더라도, 다른
 * 하위 프로젝트의 표 구조에 묶이면 그쪽이 표를 바꿀 때 여기가 깨진다.
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
}
