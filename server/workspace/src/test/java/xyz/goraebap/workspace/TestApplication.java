package xyz.goraebap.workspace;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/** foundation과 workspace만 묶은 서버. 이 하위 프로젝트의 통합 테스트가 다른 도메인 없이 도는지 확인한다. */
@SpringBootApplication(
        scanBasePackages = "xyz.goraebap",
        exclude = org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan("xyz.goraebap")
@EnableScheduling
public class TestApplication {}
