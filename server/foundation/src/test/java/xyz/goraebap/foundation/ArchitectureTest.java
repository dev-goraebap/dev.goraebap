package xyz.goraebap.foundation;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/**
 * foundation 안의 참조 방향. 폴더는 나누지 않았지만 성격은 둘이다. 다른 모듈이 가져다 쓰는 장치(shared · realtime · search · mcp)와, 자기 규칙과 데이터의 주인인 모듈(user · file · notification · system · seed)이다. 장치는 모듈을 모른다.
 */
@AnalyzeClasses(packages = "xyz.goraebap.foundation", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {
    private static final String[] DEVICES = {
        "xyz.goraebap.foundation.shared..",
        "xyz.goraebap.foundation.realtime..",
        "xyz.goraebap.foundation.search..",
        "xyz.goraebap.foundation.mcp.."
    };

    private static final String[] MODULES = {
        "xyz.goraebap.foundation.user..",
        "xyz.goraebap.foundation.file..",
        "xyz.goraebap.foundation.notification..",
        "xyz.goraebap.foundation.system..",
        "xyz.goraebap.foundation.seed.."
    };

    @ArchTest
    static final ArchRule 장치는_모듈을_참조하지_않는다 = noClasses()
            .that()
            .resideInAnyPackage(DEVICES)
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(MODULES);
}
