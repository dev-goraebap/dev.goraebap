package xyz.goraebap.module.foundation;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import xyz.goraebap.shared.persistence.ModuleMigration;

/**
 * shared와 foundation 그룹만 묶은 서버. 이 그룹의 통합 테스트가 다른 그룹 없이 도는지 확인한다. 전체 서버의 테스트가
 * 이 클래스를 설정으로 주워 가지 않도록 테스트 구성 요소로 표시한다.
 */
@TestComponent
@SpringBootApplication(
        scanBasePackages = {"xyz.goraebap.shared", "xyz.goraebap.module.foundation"},
        exclude = org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan({"xyz.goraebap.shared", "xyz.goraebap.module.foundation"})
@EnableScheduling
public class TestApplication {
    @Bean
    ModuleMigration foundationMigration() {
        return new ModuleMigration("foundation", "classpath:db/foundation", 0);
    }
}
