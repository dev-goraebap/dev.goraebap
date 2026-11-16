package xyz.goraebap.foundation;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/** foundation만 묶은 서버. 이 하위 프로젝트의 통합 테스트가 다른 도메인 없이 도는지 확인한다. */
@SpringBootApplication(
        exclude = org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
@EnableScheduling
public class TestApplication {}
